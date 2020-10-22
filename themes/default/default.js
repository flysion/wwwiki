(function () {
    var loadStyle = function(url) {
    　　var style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = url;

        document.getElementsByTagName('head')[0].appendChild(style);
    };

    var loadScript = function(url) {
    　　var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        document.getElementsByTagName('head')[0].appendChild(script);
    };

    loadStyle('https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.3.1/build/styles/default.min.css');
    loadStyle('/docsite/themes/default/default.css');
    loadScript('https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@10.3.1/build/highlight.min.js');
    loadScript('https://cdn.jsdelivr.net/npm/jquery@1.11.0/dist/jquery.min.js');
    loadScript('/docsite/docsite-sdk.js');
    loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
    loadScript('https://cdn.jsdelivr.net/npm/monaco-editor@0.21.2/min/vs/loader.js');
})();

function initDefault($options) {
    $options = $.extend({
        linkUrl: url => {
            return $url
        },
        filterNavbar: item => {
            return true;
        },
        filterList: item => {
            return true;
        }
    }, $options, docsite.getOptions());

    var mainEl = $('<div style="height:100vh; overflow-y: auto;" id="main"></div>').appendTo('body');
    var navbarEl = $('<ul id="navbar" style="display: none;"></ul></ul>').appendTo(mainEl);
    var containerEl = $('<div id="container"></div>').appendTo(mainEl);
    var pathEl = $('<ul id="path"><li class="item dir" path="/"><a href="#/" class="label">Home</a><span path="/" class="sep"></span></li></ul>').appendTo(containerEl);
    var listEl = $('<ul id="list" style="display: none"></ul>').appendTo(containerEl);
    var contentEl = $('<div id="content"></div>').appendTo(containerEl);

    const renderer = new marked.Renderer();
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

    var md2html = function (text) {
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

    if(!$options.onlyRead) {
        require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.21.2/min/vs' }});
        require(['vs/editor/editor.main'], function() {

        });

        function showMdEditor(options) {
            let el = $('<div class="editor"></div>').appendTo('body');
            let toolbarEl = $('<div class="editor-toolbar"></div>').appendTo(el);
            let containerEl = $('<div class="editor-container"></div>').appendTo(el);
            let titleLabelEl = $(`<span class="editor-title">${decodeURI(options.title)}</span>`).appendTo(toolbarEl);
            let saveEl = $(`<a href="" onclick="return false;" class="editor-tool-save">Save</a>`).appendTo(toolbarEl);
            let cancelEl = $(`<a href="" onclick="return false;" class="editor-tool-cancel">Cancel</a>`).appendTo(toolbarEl);

            cancelEl.on('click', function() {
                el.remove();
            });

            el.show();

            require(['vs/editor/editor.main'], function() {
                let editor = monaco.editor.create(containerEl[0], {language: options.language, value: options.content});

                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, function () {
                    options.onSave(editor.getValue(), editor, el);
                });

                editor.addCommand(monaco.KeyCode.Escape, function() {
                    el.remove();
                });

                saveEl.on('click', function() {
                    options.onSave(editor.getValue(), editor, el);
                });
            });
        }
    }

    var loadNavbar = function (el, items) {
        if(items === undefined || items === null) {
            docsite.api('list', {path: '/', depth: 2, only_dir: true}).done(items => {
                loadNavbar(el, items);
            }).fail(() => {
                alert('导航栏加载失败');
            });

            return;
        }

        $('#navbar').show();

        for(let i = 0; i < items.length; i++) {
            if(!$options.filterNavbar(items[i])) continue;
            let li = $(`<li><a href="#${items[i].path}">${items[i].name}</a></li>`).appendTo(el);
            if(items[i].children.length > 0) {
                let ul = $('<ul></ul>').appendTo(li);
                for(let s = 0; s < items[i].children.length; s++) {
                    if(!$options.filterNavbar(items[i].children[s])) continue;
                    $(`<li><a href="#${items[i].children[s].path}">${items[i].children[s].name}</a></li>`).appendTo(ul);
                }
            }
        }
    }

    var loadList = function (path) {
        $('#list').empty();

        docsite.api('list', {path: decodeURI(path), depth: 1, only_dir: false}).done(items => {
            for (let i = 0; i < items.length; i++) {
                if(!$options.filterList(items[i])) continue;
                if (items[i].is_file && items[i].name.substr(-3).toLowerCase() !== '.md') {
                    $(`<li><a href="${items[i].path}" target="_blank">${items[i].name}</a></li>`).appendTo('#list');
                } else {
                    $(`<li><a href="#${items[i].path}">${items[i].name}</a></li>`).appendTo('#list');
                }
            }

            $('#list').show();
        })
    }

    var destoryList = function () {
        $('#list').empty().hide();
    }

    var loadContent = function (options) {
        if(options.content === undefined || options.content === null) {
            $.get(options.path, resp => {
                loadContent($.extend(options, {content: resp}));
            }).fail(() => {
                loadContent($.extend(options, {content: ''}));
            });

            return;
        }

        $('#content').empty();

        let toolbarEl = $('<div class="content-toolbar"></div>').appendTo('#content');

        if(!$options.onlyRead) {
            let toolEditEl = $('<a href="" onclick="return false">编辑</a>').appendTo(toolbarEl);

            toolEditEl.on('click', () => {
                showMdEditor({
                    title: options.path,
                    content: options.content,
                    language: 'markdown', 
                    onSave: (content, editor, el) => {
                        docsite.writeFile(options.path, content).done((data, status, xhr) => {
                            loadContent({path: options.path, content: content});
                            el.remove();
                        }).fail(() => {
                            alert('保存失败');
                        });
                    }
                });
            });
        }

        $('#content').append(md2html(options.content));
    }

    var loadPath = function (path) {
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

        // path=更目录
        if (segments.length === 1) {
            $(`#path>li:gt(0)`).remove();
            return;
        }

        for (let i = 1; i < segments.length; i++) {
            let segment = segments[i];
            let el = $(`#path>li:eq(${i})`);

            if(el.length > 0 && el.attr('path') !== segment.path) {
                $(`#path>li:gt(${i-1})`).remove();
            }

            if (segment.path.substr(-1) === '/') {
                $('#path').append(`<li class="item dir" path="${segment.path}"><a class="label" href="#${segment.path}">${segment.name}</a><span path="${segment.path}" class="sep"></span></li>`);
            } else {
                $('#path').append(`<li class="item dir" path="${segment.path}"><a class="label" href="#${segment.path}">${segment.name}</a></li>`);
            }

            if(i === segments.length - 1) {
                $(`#path>li:gt(${i})`).remove();
            }
        }
    }

    var goto = function (path) {
        let r = path.match(/^(\/.*?)(?:\?.+)*$/);
        if (r === null) return;

        loadPath(r[1]);

        if (r[1].substr(-1) === '/') {
            loadList(r[1]);
            loadContent({path: `${r[1]}README.md`});
        } else if(r[1].substr(-3).toLowerCase() === '.md') {
            destoryList();
            loadContent({path: r[1]});
        } else {
            window.location.href = r[1];
        }
    };

    $(document).on('mouseenter', '#navbar>li', function() {
        $(this).children('a').css({'background-color': '#88ca88'});
        $(this).children('ul').css({'min-width': Math.max($(this).outerWidth(), 150)}).show();
    });

    $(document).on('mouseleave', '#navbar>li', function(e) {
        $(this).children('a').css({'background-color': 'transparent'});
        $(this).children('ul').hide();
    });

    $(document).on('mouseenter', '#path>li', function() {
        $(this).addClass('hover');
    });

    $(document).on('click', '#path>li>.sep', function() {
        if($(this).siblings('ul').length > 0) {
            $(this).siblings('ul').toggle();
            return;
        }

        let ul = $('<ul></ul>').css({'min-width': Math.max($(this).parent('li').outerWidth(), 150)});
        $(this).after(ul);

        docsite.api('list', {path: $(this).attr('path'), depth: 1, only_dir: true}).done(items => {
            if(items.length === 0) return;
            for(let i = 0; i < items.length; i++) {
                if(!$options.filterList(items[i])) continue;
                $(`<li><a href="#${items[i].path}">${items[i].name}</a></li>`).appendTo(ul);
            }
        });
    });

    $(document).on('mouseleave', '#path>li', function(e) {
        $(this).removeClass('hover');
        $(this).children('ul').hide();
    });

    $(window).on('hashchange', function() {
        if (window.location.hash === '') {
            goto('/');
            return;
        }

        goto(window.location.hash.substr(1));
    });

    $(window).trigger('hashchange');
    loadNavbar('#navbar');
}