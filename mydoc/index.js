import HttpClient from './../lib/HttpClient';
import  Path from './../lib/Path';
import EventEmitter from 'events';
import marked from 'marked';
import createElement from "../lib/createElement";
import Proxy from "../lib/Proxy"

const queryString = require('query-string');

window.MyDoc = function (options) {
    const proxy = new Proxy(this);

    this.options = $.extend({
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
    }, options);

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

    /**
     * 当前路径
     *
     * @type {null|Path}
     */
    this.path = null;

    /**
     * 目录列表
     *
     * @type {Array}
     */
    this.list = [];

    /**
     * 内容
     *
     * @type {string}
     */
    this.content = '';

    /**
     * 导航栏
     *
     * @type {Array}
     */
    this.navList = [];

    /**
     * 滚动到指定元素
     *
     * @type {string}
     */
    this.scrollTo = '';

    // 加载 dom

    this.elNavbar = createElement('<ul class="mydoc-navbar"></ul>').appendTo('body');
    this.elContainer = createElement('<div class="mydoc-container"></div>').appendTo('body');
    this.elPath = createElement('<ul class="mydoc-path"></ul>').appendTo(this.elContainer);
    this.elList = createElement('<ul class="mydoc-list"></ul>').appendTo(this.elContainer);
    this.elContent = createElement('<div class="mydoc-content"></div>').appendTo(this.elContainer);

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
            renderer.link = (href, title, text) => {
                href = this.options.link(href);

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
                highlight: this.options.highlight
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

    this.getFilePath = (path = null) => {
        path = path ? path : this.path;
        if (path.isFile()) return path;
        return path.join(this.options.indexFile);
    };

    proxy.defineProperty('path', {
        afterSet: value => {
            this.event.emit('pathChanged');
        }
    });

    proxy.defineProperty('content', {
        afterSet: value => {
            this.event.emit('contentLoaded');
        },
        set: value => {
            this.elContent.html(md2html(this.path, value));
        }
    });

    proxy.defineProperty('scrollTo', {
        set: value => {
            scrollTop(value);
        }
    });

    proxy.defineProperty('list', {
        set: value => {
            this.elList.empty();

            if (value.length === 0) {
                this.elList.hide();
                return;
            }

            this.elList.show();

            value.forEach((item) => {
                let path = Path.createFromString(item.path);

                let icon = {tag: 'span', class: ['icon']};
                let label = {tag: 'a', text: path.basename(), class: ['label']};
                let li = {tag: 'li', class: [], children: [icon, label]};

                if(path.isDirectory()) {
                    li.class.push('folder');
                    label.href = `#${path.toString()}`;
                } else if (path.ext() === 'md') {
                    li.class.push('file', `file-${path.ext()}`);
                    label.href = `#${path.toString()}`;
                } else {
                    li.class.push('file', `file-${path.ext()}`);
                    label.href = path.toString();
                    label.target = '_blank';
                }

                this.elList.append(createElement(li));
            })
        }
    });

    proxy.defineProperty('navList', {
        set: value => {
            this.elNavbar.empty().append('<li><a href="#/"><span class="fa fa-home"></span></a></li>').show();

            const treeEach = (el, items) => {
                items.forEach((item) => {
                    let path = Path.createFromString(item.path);

                    let eLi = createElement({
                        tag: 'li',
                        children: [
                            {
                                tag: 'a',
                                href: `#${path.toString()}`,
                                text: path.basename()
                            },
                        ]
                    }).appendTo(el);

                    if (item.children.length > 0) {
                        let eChild = createElement({tag: 'ul'}).appendTo(eLi);
                        treeEach(eChild, item.children);
                    }
                });
            };

            treeEach(this.elNavbar, value);
        }
    });

    this.load = (url) => {
        let results = url.match(/^(\/.*?)(?:\?(.*))*$/);
        if (!results) return;

        let path = Path.createFromString(results[1]);
        let query = queryString.parse(results[2], {arrayFormat: 'bracket'});

        if (path.isFile() && path.ext() !== 'md') {
            window.location.href = url;
            return;
        }

        if (!this.path || this.path.toString() !== path.toString()) {
            this.path = path;
            this.event.once('contentLoaded', () => {
                this.scrollTo = query.id ? query.id : '';
            });
        } else {
            this.scrollTo = query.id ? query.id : '';
        }
    };

    // 虚拟事件

    this.event.on('init', () => {
        // 加载导航栏
        this.client.tree('/', 2, true).done(items => {
            this.navList = items
        }).fail(() => {
            this.navList = [];
        });
    });

    this.event.on('init', () => {
        this.load(window.location.hash === '' ? '/' : decodeURI(window.location.hash.substr(1)));
    });

    this.event.on('pathChanged', () => {
        document.title = `${this.options.title} - ${this.path.toString()}`;
    });

    this.event.on('pathChanged', () => {
        if (this.path.isDirectory()) {
            this.client.tree(this.path.toString(), 1, false).done(items => {
                this.list = items;
            }).fail(() => {
                this.list = [];
            });
        } else {
            this.list = [];
        }
    });

    this.event.on('pathChanged', () => {
        this.client.readFile(this.getFilePath().toString()).done(resp => {
            this.content = resp;
        }).fail(() => {
            this.content = '';
        });
    });

    this.event.on('pathChanged', () => {
        let segments = this.path.segments();

        // 新的路径比原来的短，假设以前是 /a/b/c 现在是 /1/2 需要先把长度对齐（即：把 /c 去掉）
        this.elPath.children(`li.segment:gt(${segments.length - 1})`).remove();

        segments.forEach((segment, i) => {
            let old = this.elPath.children(`li.segment:eq(${i})`);

            // 路径片段相同，假设以前是 /a/b/c 跳转到 /a/d 那么 /a 是相同的，不予处理
            if(old.length > 0 && old.data('path').toString() === segment.toString()) {
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
                let click = (e, el) => {
                    let ul = el.siblings('ul');
                    if(ul.length > 0) {
                        ul.toggle();
                        return;
                    }

                    ul = createElement({tag: 'ul', class: ['active']});
                    el.after(ul);

                    this.client.tree(segment.toString(), 1, true).done(items => {
                        if(items.length === 0) return;
                        items.forEach((item) => {
                            let _path = Path.createFromString(item.path);
                            ul.append(createElement({
                                tag: 'li',
                                html: {
                                    tag: 'a',
                                    text: _path.basename(),
                                    href: `#${_path.toString()}`,
                                }
                            }));
                        });
                    });
                };

                li.children.push({
                    tag: 'span',
                    class: ['fa', 'fa-angle-right'],
                    on: { click }
                });
            }

            old.length > 0 ? old.replaceWith(createElement(li)) : this.elPath.append(createElement(li));
        });
    });

    // hash 变更事件

    $(window).on('hashchange', (e) => {
        this.load(window.location.hash === '' ? '/' : decodeURI(window.location.hash.substr(1)));
    });

    // 初始化插件

    this.options.plugins.forEach(plugin => {
        plugin(this);
    });

    // 准备启动

    this.event.emit('init');
};