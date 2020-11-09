import __ from './../lib/create_element';
import HttpClient from './../lib/HttpClient';
import  Path from './../lib/Path';
import EventEmitter from 'events';
import marked from 'marked';

const queryString = require('query-string');

window.MyDoc = function ($options) {
    $options = $.extend({
        title: document.title,
        indexFile: 'README.md',
        plugins: [

        ],
        link: url => { return url; },
        filter: path => {
            return true;
        },
        sort: (a, b) => {
            if (a.is_file === b.is_file) return a.name === b.name ? 0 : (a.name > b.name ? -1 : 1);
            if(!a.is_file) return -1;
            if(!b.is_file) return 1;
        },
        highlight: (code, lang) => {
            return code;
        }
    }, $options);

    /**
     * 服务端接口请求
     *
     * @type {HttpClient}
     */
    this.client = new HttpClient();

    /**
     * 事件引擎
     *
     * @type {EventEmitter}
     */
    this.event = new EventEmitter();

    // 加载 dom

    this.elNavbar = __('<ul class="mydoc-navbar"></ul>');
    this.elPath = __('<ul class="mydoc-path"></ul>');
    this.elList = __('<ul class="mydoc-list"></ul>');
    this.elContent = __('<div class="mydoc-content"></div>');
    this.elMain = __({
        tag: '<div class="mydoc-main"></div>',
        children: [
            this.elNavbar,
            {
                tag: '<div class="mydoc-container"></div>',
                children: [
                    this.elPath, this.elList, this.elContent
                ],
            }
        ],
    });

    this.elMain.appendTo('body');

    /**
     * 将 markdown 转换成 html
     *
     * @link https://marked.js.org/using_pro
     * @return string
     */
    const md2html = (() => {
        marked.use({
            walkTokens: token => {
                if(token.type === 'list' || token.type === 'list_item') {

                }
            }
        });

        return (path, text, callback) => {
            const renderer = new marked.Renderer();
            renderer.link = function(href, title, text) {
                href = $options.link(href);

                if(/^\w+:\/\//.test(href)) {
                    return `<a href="${href}" target="_blank" title="${title ? title : ''}">${text}</a>`;
                }

                let r = href.match(/^(\/*)(.*?(?:\.md|\/))(?:#(.+))*$/);
                if (r) {
                    let root = Path.createFromString(r[1] === '' ? path.isFile() ? path.dirname() : path.toString() : r[1]);
                    if(r[3]) {
                        href = `#${root.join(r[2]).toString()}?id=${r[2]}`;
                    } else {
                        href = `#${root.join(r[2]).toString()}`;
                    }
                }

                return `<a href="${href}" title="${title ? title : ''}">${text}</a>`;
            };
            
            renderer.listitem = function (text, task, checked) {
                return `<li class="${task ? 'task-list-item' : 'list-item'}">${text}</li>`;
            };

            renderer.list = function (body, ordered, start) {
                const isTask = $(body).children('li>input[type=checkbox]').length > 0;
                const tag = ordered ? 'ol' : 'ul';
                const startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
                const className = ` class="${isTask ? 'task-list' : 'list'}"`;
                return '<' + tag + startatt + className + '>\n' + body + '</' + tag + '>\n';
            };

            return marked(text, {
                renderer: renderer,
                headerIds: true,
                headerPrefix: '',
                langPrefix: 'language-',
                highlight: $options.highlight
            }, callback);
        };
    }) ();

    /**
     * 使视图Y轴滚动到指定ID元素的位置
     *
     * @param id
     */
    const scrollTop = (id) => {
        let el = $(document.getElementById(id));
        if(el.length > 0) {
            $('html').animate({scrollTop: el.position().top}, 500);
        }
    };

    /**
     * 渲染列表
     *
     * @param {Path} path
     */
    const renderList = (path) => {
        this.client.tree(path.toString(), 1, false).done(items => {
            this.elList.empty();

            items.sort($options.sort);
            items.forEach((item) => {
                let _path = Path.createFromString(item.path);
                if(!$options.filter(_path)) return;

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

                this.elList.append(__(li));
            });

            this.elList.children('li').length === 0 ? this.elList.hide() : this.elList.show();
        }).fail(() => {
            this.elList.empty().hide();
        });
    };

    /**
     * 渲染导航栏
     */
    const renderNavbar = () => {
        this.elNavbar.empty().append('<li><a href="#/"><span class="fa fa-home"></span></a></li>').show();
        const treeEach = function(el, items) {
            items.sort($options.sort);
            items.forEach((item) => {
                let _path = Path.createFromString(item.path);
                if (!$options.filter(_path)) return;

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

        this.client.tree('/', 2, true).done(items => {
            treeEach(this.elNavbar, items);
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
        this.elPath.children(`li.segment:gt(${segments.length - 1})`).remove();

        segments.forEach((segment, i) => {
            let eOld = this.elPath.children(`li.segment:eq(${i})`);

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

                            this.client.tree(segment.toString(), 1, true).done(items => {
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

            eOld.length > 0 ? eOld.replaceWith(__(li)) : this.elPath.append(__(li));
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
            this.client.readFile(path.isFile() ? path.toString() : path.join($options.indexFile).toString()).done(resp => {
                renderContent(path, query, resp);
            }).fail(() => {
                renderContent(path, query, '');
            });

            return ;
        }

        this.elContent.html(md2html(path, text));

        this.event.emit('contentReloaded', path, query);
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
    const load = (() => {
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
                this.event.emit('pathChange', path, query);
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

    this.event.on('initCompleted', () => {
        renderNavbar();
    });

    this.event.on('initCompleted', () => {
        loadHash();
    });

    this.event.on('pathChange', path => {
        document.title = `${$options.title} - ${path.toString()}`;
    });

    this.event.on('pathChange', path => {
        if (path.isFile()) {
            this.elList.empty().hide();
        }
    });

    this.event.on('pathChange', path => {
        if (path.isDirectory()) {
            renderList(path);
        }
    });

    this.event.on('pathChange', (path, query) => {
        renderContent(path, query);
    });

    this.event.on('pathChange', path => {
        renderPath(path);
    });

    this.event.on('contentReloaded', (path, query) => {
        if (query.id) {
            scrollTop(query.id);
        }
    });

    // this.event.on('pathChange', pathObj => {
    //     this.elPath.children('li.tools').remove();
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
    //     }).appendTo(this.elPath);
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
    //     //     this.elPathToolbar.append(__({
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
    //     // this.elPath.children('.tool').remove();
    //     // this.elPath.append(__({
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

    // this.elPath.on('mouseleave', 'li.segment', function() {
    //     $(this).children('ul').hide();
    // })
    //
    // this.elPath.on('click', 'li.segment>span', function() {
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
    //     tree(eBtn.data('path').toString(), 1, true).done(items => {
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
        plugin(this);
    });

    this.event.emit('initCompleted');
};