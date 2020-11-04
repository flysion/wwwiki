import __ from './../lib/create_element';
import { list, readFile } from './../lib/request';
import  Path from './../lib/Path';
import EventEmitter from 'events';
const queryString = require('query-string');

window.MyDoc = function ($options) {
    $options = $.extend({
        el: 'body',
        indexFile: 'README.md',
        plugins: [

        ],
        linkUrl: url => { return url; },
        title: document.title,
    }, $options);

    // 加载 dom

    const $eNavbar = __('<ul class="mydoc-navbar"></ul>');
    const $ePath = __('<ul class="mydoc-path"></ul>');
    const $eList = __('<ul class="mydoc-list"></ul>');
    const $eContent = __('<div class="mydoc-content"></div>');
    const $eMain = __({
        tag: '<div class="mydoc-main"></div>',
        children: [
            $eNavbar,
            {
                tag: '<div class="mydoc-container"></div>',
                children: [
                    $ePath, $eList, $eContent
                ],
            }
        ],
    });

    $eMain.appendTo($options.el);

    // 初始化事件

    const $event = new EventEmitter();

    /**
     * 将 markdown 转换成 html
     *
     * @return string
     */
    const md2html = (function() {
        let renderer = new marked.Renderer();

        renderer.link = function(href, title, text) {
            href = $options.linkUrl(href);

            if(/^\w+:\/\//.test(href)) {
                return `<a href="${href}" target="_blank" title="${title ? title : ''}">${text}</a>`;
            }

            do {
                let r = href.match(/^(.*?(?:\.md|\/))(?:#(.+))*$/);
                if (!r) break;

                if(r[2]) {
                    href = `#${r[1]}?id=${r[2]}`;
                } else {
                    href = `#${r[1]}`;
                }
            } while(false);

            return `<a href="${href}" title="${title ? title : ''}">${text}</a>`;
        };

        return (text) => {
            const lexer = new marked.Lexer();
            const tokens = lexer.lex(text);
            return marked.parser(tokens, {
                renderer: renderer,
                headerIds:true,
                headerPrefix: '',
                langPrefix: 'language-',
                highlight: function (code) {
                    return hljs.highlightAuto(code).value;
                }
            });
        };
    }) ();

    /**
     * 使视图Y轴滚动到指定ID元素的位置
     *
     * @param id
     */
    const scrollTop = (id) => {
        let el = $(document.getElementById(id));
        if(el.length === 0) return;
        $eMain.animate({scrollTop: el.offset().top + $eMain.prop('scrollTop')}, 500);
    };

    /**
     * 渲染列表
     *
     * @param {Path} path
     */
    const renderList = function (path) {
        list(path.toString(), 1, false).done(items => {
            $eList.empty();

            items.forEach((item) => {
                let _path = Path.createFromString(item.path);
                if (_path.basename() === $options.indexFile) return;

                let  li = {
                    tag: 'li',
                    class: [],
                    children: {
                        icon: {
                            tag: 'span',
                            class: ['icon'],
                        },
                        label: {
                            tag: 'a',
                            text: _path.basename(),
                            class: ['label']
                        }
                    }
                };

                if(_path.isDirectory()) {
                    li.class.push('folder');
                    li.children.label.href = `#${_path.toString()}`;
                } else if (_path.ext() === 'md') {
                    li.class.push('file', `file-${_path.ext()}`);
                    li.children.label.href = `#${_path.toString()}`;
                } else {
                    li.class.push('file', `file-${_path.ext()}`);
                    li.children.label.href = _path.toString();
                    li.children.label.target = '_blank';
                }

                $eList.append(__(li));
            });

            $eList.show();
        });
    };

    /**
     * 渲染导航栏
     */
    const renderNavbar = () => {
        $eNavbar.empty().append('<li><a href="#/"><span class="fa fa-home"></span></a></li>').show();

        const treeEach = function(el, items) {
            items.forEach((item) => {
                let _path = Path.createFromString(item.path);

                let eLi = __({
                    tag: 'li',
                    children: [
                        {
                            tag: 'a',
                            href: `#${_path.toString()}`,
                            text: _path.basename()
                        },
                    ]
                }).appendTo(el);

                if (item.children.length > 0) {
                    let eChild = __({tag: 'ul'}).appendTo(eLi);
                    treeEach(eChild, item.children);
                }
            });
        };

        list('/', 2, true).done(items => {
            treeEach($eNavbar, items);
        });
    };

    /**
     * 渲染路径
     *
     * @param {Path} path
     */
    const renderPath = path => {
        let segments = path.segments();

        // 新的路径比原来的短，假设以前是 /a/b/c 现在是 /1/2 需要先把长度对齐（即：把 /c 去掉）
        $ePath.children(`li.segment:gt(${segments.length - 1})`).remove();

        segments.forEach((segment, i) => {
            let eOld = $ePath.children(`li.segment:eq(${i})`);

            // 路径片段相同，假设以前是 /a/b/c 跳转到 /a/d 那么 /a 是相同的，不予处理
            if(eOld.length > 0 && eOld.data('path').toString() === segment.toString()) {
                return;
            }

            let li = {
                tag: 'li',
                class: ['segment', segment.isDirectory() ? 'folder' : 'file'],
                data: {path: segment},
                children: [
                    {
                        tag: 'a',
                        text: i === 0 ? "" : segment.basename(),
                        html: i === 0 ? {tag: 'span', class: ['fa', 'fa-home']} : null,
                        class: i === 0 ? ['root'] : ['label'],
                        href: `#${segment.toString()}`
                    }
                ],
                on: {
                    mouseleave: (e, el) => {
                        el.children('ul').hide();
                    }
                }
            };

            if (segment.isDirectory()) {
                li.children.push({
                    tag: 'span',
                    class: ['fa', 'fa-angle-right'],
                    on: {
                        click: (e, el) => {
                            let ul = el.siblings('ul');
                            if(ul.length > 0) {
                                ul.toggle();
                                return;
                            }

                            ul = __({tag: 'ul', class: ['active']});
                            el.after(ul);

                            list(segment.toString(), 1, true).done(items => {
                                if(items.length === 0) return;
                                items.forEach((item) => {
                                    let _path = Path.createFromString(item.path);
                                    ul.append(__({
                                        tag: 'li',
                                        html: {
                                            tag: 'a',
                                            text: _path.basename(),
                                            href: `#${_path.toString()}`,
                                        }
                                    }));
                                });
                            });
                        }
                    }
                });
            }

            eOld.length > 0 ? eOld.replaceWith(__(li)) : $ePath.append(__(li));
        });
    };

    /**
     * 渲染内容
     *
     * @param {Path} path
     * @param {string} query
     * @param {string} text
     */
    const renderContent = (path, query, text = null) => {
        if (text === null) {
            readFile(path.isFile() ? path.toString() : path.join($options.indexFile).toString()).done(resp => {
                renderContent(path, query, resp);
            }).fail(() => {
                renderContent(path, query, '');
            });

            return ;
        }

        $eContent.html(md2html(text));

        $event.emit('contentReloaded', path, query);
    };
    //
    // const showMdEditor = (options) => {
    //     let el = $('<div class="mydoc-editor"></div>').appendTo('body');
    //     let toolbarEl = $('<div class="mydoc-editor-toolbar"></div>').appendTo(el);
    //     let containerEl = $('<div class="mydoc-editor-container"></div>').appendTo(el);
    //     let titleLabelEl = $(`<span class="mydoc-editor-title">${decodeURI(options.title)}</span>`).appendTo(toolbarEl);
    //     let saveEl = $(`<a href="" onclick="return false;" class="mydoc-editor-tool-save">Save</a>`).appendTo(toolbarEl);
    //     let cancelEl = $(`<a href="" onclick="return false;" class="mydoc-editor-tool-cancel">Cancel</a>`).appendTo(toolbarEl);
    //
    //     cancelEl.on('click', function() {
    //         el.remove();
    //     });
    //
    //     el.show();
    //
    //     require(['vs/editor/editor.main'], function() {
    //         let editor = monaco.editor.create(containerEl[0], {language: options.language, value: options.content});
    //
    //         editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, function () {
    //             options.onSave(editor.getValue(), editor, el);
    //         });
    //
    //         editor.addCommand(monaco.KeyCode.Escape, function() {
    //             el.remove();
    //         });
    //
    //         saveEl.on('click', function() {
    //             options.onSave(editor.getValue(), editor, el);
    //         });
    //     });
    // };

    /**
     * 页面加载
     */
    const load = (function() {
        let currentPath = null;

        return (url) => {
            let r = url.match(/^(\/.*?)(\?.+)*$/);
            if (r === null) return;

            let path = Path.createFromString(r[1]);
            let query = queryString.parse(r[2], {arrayFormat: 'bracket'});

            if (path.isFile() && path.ext() !== 'md') {
                window.location.href = url;
                return;
            }

            if (currentPath === null || currentPath.toString() !== path.toString()) {
                $event.emit('pathChange', path, query);
                currentPath = path;
                return;
            } else if(query.id) {
                scrollTop(query.id);
            }

            return path;
        };
    })();

    /**
     * 页面加载-通过 window.location.hash
     */
    const loadHash = () => {
        load(window.location.hash === '' ? '/' : decodeURI(window.location.hash.substr(1)));
    };

    // 虚拟事件

    $event.on('initCompleted', () => {
        renderNavbar();
    });

    $event.on('initCompleted', () => {
        loadHash();
    });

    $event.on('pathChange', path => {
        document.title = `${$options.title} - ${path.toString()}`;
    });

    $event.on('pathChange', path => {
        if (path.isFile()) {
            $eList.hide();
        }
    });

    $event.on('pathChange', path => {
        if (path.isDirectory()) {
            renderList(path);
        }
    });

    $event.on('pathChange', (path, query) => {
        renderContent(path, query);
    });

    $event.on('pathChange', path => {
        renderPath(path);
    });

    $event.on('contentReloaded', (path, query) => {
        if (query.id) {
            scrollTop(query.id);
        }
    });

    // $event.on('pathChange', pathObj => {
    //     $ePath.children('li.tools').remove();
    //
    //     const ePathToolbar = __({tag: 'ul'});
    //     __({
    //         tag: 'li',
    //         class: ['tools'],
    //         children: [
    //             {
    //                 tag: 'a',
    //                 html: {
    //                     tag: 'span', class: ['fa', 'fa-angle-down']
    //                 }
    //             },
    //             ePathToolbar
    //         ]
    //     }).appendTo($ePath);
    //
    //
    //     if (pathObj.isFile() && pathObj.ext() === 'md') {
    //         ePathToolbar.append(__({
    //             tag: 'li',
    //             html: {tag: 'span', class: ['fa', 'fa-edit']},
    //             attr: {
    //                 title: `编辑"${pathObj.toString()}"`,
    //             },
    //             on: {
    //                 click: () => {
    //                     require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.21.2/min/vs' }});
    //                     require(['vs/editor/editor.main'], function() {
    //                         showMdEditor('markdown', '');
    //                     });
    //                 }
    //             }
    //         }));
    //     }
    //
    //     // if (pathObj.isDirectory()) {
    //     //     $ePathToolbar.append(__({
    //     //         tag: 'li',
    //     //         html: {tag: 'span', class: ['fa', 'fa-folder-o']},
    //     //         attr: {
    //     //             title: `在"${pathObj.toString()}"创建目录`,
    //     //         },
    //     //         on: {
    //     //             click: (e, el) => {
    //     //                 let name = prompt(`在"${pathObj.toString()}"创建目录：`);
    //     //                 if (name === '/' || name === '' || name === null) return;
    //     //
    //     //                 mkdir(pathObj.join(Path.strip(name) + '/').toString(), {recursive:true, mode:0o666}).done(item => {
    //     //                     renderNavbar(pathObj);
    //     //                     renderList(pathObj);
    //     //                     renderPath(pathObj);
    //     //                 });
    //     //             }
    //     //         }
    //     //     }));
    //     //     //
    //     //     // tools.children.push({
    //     //     //     tag: 'li',
    //     //     //     html: {tag: 'span', class: ['fa', 'fa-file-o']},
    //     //     //     attr: {
    //     //     //         title: `在"${pathObj.toString()}"创建文件`,
    //     //     //     },
    //     //     //     on: [
    //     //     //
    //     //     //     ]
    //     //     // });
    //     // }
    //     //
    //     // if (pathObj.isDirectory() && !pathObj.isRoot()) {
    //     //     tools.children.push({
    //     //         tag: 'li',
    //     //         html: {tag: 'span', class: ['fa', 'fa-pencil']},
    //     //         attr: {
    //     //             title: `重命名"${pathObj.toString()}"`,
    //     //         },
    //     //         on: [
    //     //
    //     //         ]
    //     //     });
    //     //
    //     //     tools.children.push({
    //     //         tag: 'li',
    //     //         html: {tag: 'span', class: ['fa', 'fa-trash']},
    //     //         attr: {
    //     //             title: `删除目录"${pathObj.toString()}"`,
    //     //         },
    //     //         on: [
    //     //
    //     //         ]
    //     //     });
    //     // }
    //     //
    //     // if (pathObj.isFile()) {
    //     //     tools.children.push({
    //     //         tag: 'li',
    //     //         html: {tag: 'span', class: ['fa', 'fa-edit']},
    //     //         attr: {
    //     //             title: `编辑"${pathObj.toString()}"`,
    //     //         },
    //     //         on: [
    //     //
    //     //         ]
    //     //     });
    //     //
    //     //     tools.children.push({
    //     //         tag: 'li',
    //     //         html: {tag: 'span', class: ['fa', 'fa-pencil']},
    //     //         attr: {
    //     //             title: `重命名"${pathObj.toString()}"`,
    //     //         },
    //     //         on: [
    //     //
    //     //         ]
    //     //     });
    //     //
    //     //     tools.children.push({
    //     //         tag: 'li',
    //     //         html: {tag: 'span', class: ['fa', 'fa-trash']},
    //     //         attr: {
    //     //             title: `删除文件"${pathObj.toString()}"`,
    //     //         },
    //     //         on: [
    //     //
    //     //         ]
    //     //     });
    //     // }
    //     //
    //     // $ePath.children('.tool').remove();
    //     // $ePath.append(__({
    //     //     tag: 'li',
    //     //     class: ['tool'],
    //     //     children: [
    //     //         {tag: 'span', class: ['fa', 'fa-angle-down']},
    //     //         tools
    //     //     ]
    //     // }));
    // })

    // 元素事件

    $(window).on('hashchange', () => {
        loadHash();
    });
    //
    // $ePath.on('mouseleave', 'li.segment', function() {
    //     $(this).children('ul').hide();
    // })
    //
    // $ePath.on('click', 'li.segment>span', function() {
    //     let eBtn = $(this);
    //     let ePanel = eBtn.siblings('ul');
    //
    //     if(ePanel.length > 0) {
    //         ePanel.toggle();
    //         return;
    //     }
    //
    //     ePanel = __({tag: 'ul', class: ['active']});
    //     eBtn.after(ePanel);
    //
    //     list(eBtn.data('path').toString(), 1, true).done(items => {
    //         if(items.length === 0) return;
    //         items.forEach((item) => {
    //             let _path = Path.createFromString(item.path);
    //             ePanel.append(__({
    //                 tag: 'li',
    //                 html: {
    //                     tag: 'a',
    //                     text: _path.basename(),
    //                     href: `#${_path.toString()}`,
    //                 }
    //             }));
    //         });
    //     });
    // });

    $options.plugins.forEach(plugin => {
        plugin(this, $event, $eMain);
    });

    $event.emit('initCompleted');
};