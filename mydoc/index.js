import __ from './../lib/create_element';
import { list, readFile, mkdir } from './../lib/request';
import  Path from './../lib/Path';
import EventEmitter from 'events';

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

    const $event = new EventEmitter();

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

    const renderList = function (pathObj) {
        list(pathObj.toString(), 1, false).done(items => {
            $eList.empty();

            items.forEach((item) => {
                let _pathObj = Path.createFromString(item.path);

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
                            text: _pathObj.basename(),
                            class: ['label'],
                            attr: {}
                        }
                    }
                };

                if(_pathObj.isDirectory()) {
                    li.class.push('folder');
                    li.children.label.attr.href = `#${_pathObj.toString()}`;
                } else if (_pathObj.ext() === 'md') {
                    li.class.push('file', `file-${_pathObj.ext()}`);
                    li.children.label.attr.href = `#${_pathObj.toString()}`;
                } else {
                    li.class.push('file', `file-${_pathObj.ext()}`);
                    li.children.label.attr.href = _pathObj.toString();
                    li.children.label.attr.target = '_blank';
                }

                $eList.append(__(li));
            });

            $eList.show();
        });
    };

    const renderNavbar = () => {
        $eNavbar.empty().append('<li><a href="#/"><span class="fa fa-home"></span></a></li>').show();

        const treeEach = function(el, items) {
            items.forEach((item) => {
                let _pathObj = Path.createFromString(item.path);

                let eLi = __({
                    tag: 'li',
                    children: [
                        {
                            tag: 'a',
                            attr: {href: `#${_pathObj.toString()}`},
                            text: _pathObj.basename()
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

    const renderPath = pathObj => {
        let segments = pathObj.segments();

        // 新的路径比原来的短，假设以前是 /a/b/c 现在是 /1/2 需要先把长度对齐（即：把 /c 去掉）
        $ePath.children(`li.segment:gt(${segments.length - 1})`).remove();

        segments.forEach((segment, i) => {
            let eOld = $ePath.children(`li.segment:eq(${i})`);

            // 路径片段相同，假设以前是 /a/b/c 跳转到 /a/d 那么 /a 是相同的，不予处理
            if(eOld.data('path') === segment.toString()) {
                return;
            }

            let li = {
                tag: 'li',
                class: ['segment', segment.isDirectory() ? 'folder' : 'file'],
                data: {
                    'path': segment.toString()
                },
                children: [
                    {
                        tag: 'a',
                        text: i === 0 ? "" : segment.basename(),
                        html: i === 0 ? {tag: 'span', class: ['fa', 'fa-home']} : null,
                        class: i === 0 ? ['label', 'root'] : ['label'],
                        attr: {href: `#${segment.toString()}`}
                    }
                ]
            };

            if (segment.isDirectory()) {
                li.children.push({
                    tag: 'span',
                    data: {pathObj: segment},
                    html: {tag: 'span', class: ['fa', 'fa-angle-right']},
                });
            }

            eOld.length > 0 ? eOld.replaceWith(__(li)) : $ePath.append(__(li));
        });
    };

    const renderContent = (pathObj, path, text = null) => {
        if (text === null) {
            readFile(path).done(resp => {
                renderContent(pathObj, path, resp);
            }).fail(() => {
                renderContent(pathObj, path, '');
            });

            return ;
        }

        $eContent.html(md2html(text));

        $event.emit('uiRenderContentCompleted', pathObj, path);
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

    const load = (path) => {
        let r = path.match(/^(\/.*?)(?:\?.+)*$/);
        if (r === null) return;

        let pathObj = Path.createFromString(r[1]);

        if (pathObj.isFile() && pathObj.ext() !== 'md') {
            window.location.href = r[1];
            return;
        }

        $event.emit('pathchange', pathObj);

        return pathObj;
    };

    const loadHash = () => {
        if (window.location.hash === '') {
            load('/');
            return;
        }

        load(decodeURI(window.location.hash.substr(1)));
    };

    // 虚拟事件

    $event.on('initCompleted', () => {
        renderNavbar();
    });

    $event.on('initCompleted', () => {
        loadHash();
    });

    $event.on('pathchange', pathObj => {
        document.title = `${$options.title} - ${pathObj.toString()}`;
    });

    $event.on('pathchange', pathObj => {
        if (pathObj.isFile()) {
            $eList.hide();
        }
    });

    $event.on('pathchange', pathObj => {
        if (pathObj.isDirectory()) {
            renderList(pathObj);
        }
    });

    $event.on('pathchange', pathObj => {
        renderContent(pathObj, pathObj.isFile() ? pathObj.toString() : pathObj.join($options.indexFile).toString());
    });

    $event.on('pathchange', pathObj => {
        renderPath(pathObj);
    });

    // $event.on('pathchange', pathObj => {
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

    $ePath.on('mouseleave', 'li.segment', function() {
        $(this).children('ul').hide();
    })

    $ePath.on('click', 'li.segment>span', function() {
        let eBtn = $(this);
        let ePanel = eBtn.siblings('ul');

        if(ePanel.length > 0) {
            ePanel.toggle();
            return;
        }

        ePanel = __({tag: 'ul', class: ['active']});
        eBtn.after(ePanel);

        list(eBtn.data('pathObj').toString(), 1, true).done(items => {
            if(items.length === 0) return;
            items.forEach((item) => {
                let _pathObj = Path.createFromString(item.path);
                ePanel.append(__({
                    tag: 'li',
                    html: {
                        tag: 'a',
                        text: _pathObj.basename(),
                        attr: {
                            href: `#${_pathObj.toString()}`,
                        }
                    }
                }));
            });
        });
    });

    $options.plugins.forEach((plugin) => {
        plugin($event, $eMain);
    });

    $eMain.appendTo($options.el);

    $event.emit('initCompleted');
};