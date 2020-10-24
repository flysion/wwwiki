"use strict";

(function(window) {
    $docsite.loadStyle('https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.3.1/build/styles/default.min.css');
    $docsite.loadStyle('/docsite/font-awesome-4.7.0/css/font-awesome.min.css');
    $docsite.loadStyle('/docsite/themes/mydoc/mydoc.css');

    $docsite.loadScript('https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.3.1/build/highlight.min.js');
    $docsite.loadScript('https://cdn.jsdelivr.net/npm/jquery@1.11.0/dist/jquery.min.js');
    $docsite.loadScript('/docsite/docsite-sdk.js');
    $docsite.loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
    $docsite.loadScript('https://cdn.jsdelivr.net/npm/monaco-editor@0.21.2/min/vs/loader.js');

    window.mydoc = function($options) {
        $options = $.extend({
            indexFile: 'README.md',
            linkUrl: url => {return url;},
            filterNavbar: item => {return true;},
            filterList: item => {return true;},
            sort: (item1, item2, path) => {
                if(!item1.is_file && item2.is_file) return -1;
                if(item1.is_file && !item2.is_file) return 1;
                if(item1.name < item2.name) return -1;
                if(item1.name > item2.name) return 1;
                return 0;
            }
        }, $options);

        window.$docsite.createElement({
            tag: '<div class="mydoc-main"></div>', 
            children: [
                {
                    tag: '<ul class="mydoc-navbar"></ul>',
                },
                {
                    tag: '<div class="mydoc-container"></div>',
                    children: [
                        {
                            tag: '<ul class="mydoc-path"></ul>',
                        },
                        '<ul class="mydoc-list"></ul>',
                        '<div class="mydoc-content"></div>',
                    ]
                }
            ],
        }).appendTo('body');

        // markdown

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

        // require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.21.2/min/vs' }});
        // require(['vs/editor/editor.main'], function() {

        // });

        // function showMdEditor(options) {
        //     let el = $('<div class="mydoc-editor"></div>').appendTo('body');
        //     let toolbarEl = $('<div class="mydoc-editor-toolbar"></div>').appendTo(el);
        //     let containerEl = $('<div class="mydoc-editor-container"></div>').appendTo(el);
        //     let titleLabelEl = $(`<span class="mydoc-editor-title">${decodeURI(options.title)}</span>`).appendTo(toolbarEl);
        //     let saveEl = $(`<a href="" onclick="return false;" class="mydoc-editor-tool-save">Save</a>`).appendTo(toolbarEl);
        //     let cancelEl = $(`<a href="" onclick="return false;" class="mydoc-editor-tool-cancel">Cancel</a>`).appendTo(toolbarEl);

        //     cancelEl.on('click', function() {
        //         el.remove();
        //     });

        //     el.show();

        //     require(['vs/editor/editor.main'], function() {
        //         let editor = monaco.editor.create(containerEl[0], {language: options.language, value: options.content});

        //         editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, function () {
        //             options.onSave(editor.getValue(), editor, el);
        //         });

        //         editor.addCommand(monaco.KeyCode.Escape, function() {
        //             el.remove();
        //         });

        //         saveEl.on('click', function() {
        //             options.onSave(editor.getValue(), editor, el);
        //         });
        //     });
        // }

        const loadNavbar = function (items) {
            if(items === undefined || items === null) {
                $docsite.fileSystem.list('/', 2, true).done(items => {
                    loadNavbar(items);
                }).fail(() => {
                    alert('导航栏加载失败');
                });

                return;
            }

            $('.mydoc-navbar').empty().append('<li><a href="#/"><span class="fa fa-home"></span></a></li>').show();

            for(let i = 0; i < items.length; i++) {
                if(!$options.filterNavbar(items[i])) {
                    continue;
                }

                let li = {
                    tag: 'li',
                    children: [
                        {
                            tag: 'a',
                            attr: {href: `#${items[i].path}`},
                            text: items[i].name
                        },
                    ]
                };

                let child = {
                    tag: 'ul',
                    children: [],
                };

                for(let s = 0; s < items[i].children.length; s++) {
                    if(!$options.filterNavbar(items[i].children[s])) {
                        continue;
                    }

                    child.children.push({
                        tag: 'li',
                        children: [
                            {
                                tag: 'a',
                                attr: {href: `#${items[i].children[s].path}`},
                                text: items[i].children[s].name
                            },
                        ]
                    });
                }

                if (child.children.length) {
                    let ulEl = window.$docsite.createElement(child);
                    li.children.push(ulEl);
                }

                $('.mydoc-navbar').append(window.$docsite.createElement(li));
            }
        }

        const destoryList = function () {
            $('.mydoc-list').empty().hide();
        }

        const loadList = function (path) {
            destoryList();

            window.$docsite.fileSystem.list(path, 1, false).done(items => {
                for (let i = 0; i < items.length; i++) {
                    if(!$options.filterList(items[i])) continue;

                    let icon = {
                        tag: 'span',
                        class: ['icon', 'fa'],
                    }

                    let label = {
                        tag: 'a',
                        text: items[i].name,
                        class: ['label'],
                        attr: {}
                    }

                    let  li = {
                        tag: 'li',
                        class: [],
                        children: [icon, label]
                    };

                    if(!items[i].is_file) {
                        li.class.push('folder');
                        label.attr['href'] = `#${items[i].path}`;
                    } else if (items[i].extname === '.md') {
                        li.class.push('file', `file-${items[i].extname.toLowerCase().substr(1)}`);
                        label.attr['href'] = `#${items[i].path}`;
                    } else {
                        li.class.push('file', `file-${items[i].extname.toLowerCase().substr(1)}`);
                        label.attr['href'] = items[i].path;
                        label.attr['target'] = '_blank';
                    }

                    $('.mydoc-list').append(window.$docsite.createElement(li));
                }

                $('.mydoc-list').show();
            })
        }

        const loadContent = function (options) {
            if(options.content === undefined || options.content === null) {
                window.$docsite.fileSystem.readFile(options.path).done(resp => {
                    loadContent($.extend(options, {content: resp}));
                }).fail(() => {
                    loadContent($.extend(options, {content: ''}));
                });

                return;
            }

            $('.mydoc-content').empty();

            // let toolbarEl = $('<div class="mydoc-content-toolbar"></div>').appendTo('.content');

            // if(!$options.onlyRead) {
            //     let toolEditEl = $('<a href="" onclick="return false">编辑</a>').appendTo(toolbarEl);

            //     toolEditEl.on('click', () => {
            //         showMdEditor({
            //             title: options.path,
            //             content: options.content,
            //             language: 'markdown', 
            //             onSave: (content, editor, el) => {
            //                 window.$docsite.fileSystem.writeFile(options.path, {encoding: 'utf8'}, content).done((data, status, xhr) => {
            //                     loadContent({path: options.path, content: content});
            //                     el.remove();
            //                 }).fail(() => {
            //                     alert('保存失败');
            //                 });
            //             }
            //         });
            //     });
            // }

            $('.mydoc-content').append(md2html(options.content));
        }

        const loadPath = function (path) {
            let segments = [];
            let name = '';
            for(let i = 0; i < path.length; i++) {
                let c = path[i];
                if(c === '/') {
                    segments.push({name: decodeURI(name), path: decodeURI(path.substr(0, i + 1))});
                    name = '';
                } else if(i === path.length - 1) {
                    segments.push({name: decodeURI(name + c), path: decodeURI(path.substr(0, i + 1))});
                    name = '';
                } else {
                    name += c;
                }
            }

            // 新的路径比原来的短
            $(`.mydoc-path>li:gt(${segments.length - 1})`).remove();

            for (let i = 0; i < segments.length; i++) {
                let segment = segments[i];
                let oldEl = $(`.mydoc-path>li:eq(${i})`);

                if(oldEl.length > 0 && oldEl.data('mydoc-data-path') === segment.path) {
                    continue;
                }

                let li = {
                    tag: 'li',
                    class: segment.path.substr(-1) === '/' ? 'folder' : 'file',
                    data: {
                        'mydoc-data-path': segment.path
                    },
                    children: [
                        {
                            tag: 'a',
                            text: segment.name,
                            class: i === 0 ? ['label', 'root', 'fa', 'fa-home'] : ['label'],
                            attr: {
                                href: `#${segment.path}`
                            }
                        }
                    ],
                    on: [
                        {
                            name: 'mouseenter',
                            fn: function(e, el) {
                                el.addClass('hover');
                            }
                        },
                        {
                            name: 'mouseleave',
                            fn: function(e, el) {
                                el.removeClass('hover');
                                el.children('ul').hide();
                            }
                        }
                    ]
                }

                if (segment.path.substr(-1) === '/') {
                    li.children.push({
                        tag: 'span',
                        class: 'sep',
                        on: {
                            name: 'click',
                            data: {path: segment.path},
                            fn: (e, el) => {
                                if(el.siblings('ul').length > 0) {
                                    el.siblings('ul').toggle();
                                    return;
                                }

                                let ul = {
                                    tag: 'ul',
                                    children: []
                                }

                                window.$docsite.fileSystem.list(e.data.path, 1, true).done(items => {
                                    if(items.length === 0) return;

                                    for(let i = 0; i < items.length; i++) {
                                        if(!$options.filterList(items[i])) continue;

                                        ul.children.push({
                                            tag: 'li',
                                            children: [
                                                {
                                                    tag: 'a',
                                                    text: items[i].name,
                                                    attr: {
                                                        href: `#${items[i].path}`,
                                                    }
                                                }
                                            ]
                                        });
                                    }

                                    el.after(window.$docsite.createElement(ul));
                                });
                            }
                        }
                    });
                }

                let el = $(window.$docsite.createElement(li));

                if(oldEl.length > 0 ) {
                    oldEl.replaceWith(el);
                } else {
                    el.appendTo('.mydoc-path');
                }
            }
        }

        const goto = function (path) {
            let r = path.match(/^(\/.*?)(?:\?.+)*$/);
            if (r === null) return;

            loadPath(r[1]);

            if (r[1].substr(-1) === '/') {
                loadList(decodeURI(r[1]));
                loadContent({path: `${r[1]}${$options.indexFile}`});
            } else if(r[1].substr(-3).toLowerCase() === '.md') {
                destoryList();
                loadContent({path: r[1]});
            } else {
                window.location.href = r[1];
            }
        };

        const gotoHash = function() {
            if (window.location.hash === '') {
                goto('/');
                return;
            }

            goto(window.location.hash.substr(1));
        };

        $(window).on('hashchange', function() {
            gotoHash();
        });

        gotoHash();

        loadNavbar();
    };
} (window));