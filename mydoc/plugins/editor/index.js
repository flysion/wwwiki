import createElement from './../../../lib/createElement';
import './index.css';
import Path from "../../../lib/Path";
import loadScript from "../../../lib/loadScript";

window.Editor = function($options) {
    $options = $.extend({
        editor: {

        },
        languages: {
            md: "markdown",
            txt: "plaintext",
        }
    }, $options);

    loadScript('https://cdn.jsdelivr.net/npm/monaco-editor@0.21.2/min/vs/loader.js', () => {
        window.require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.21.2/min/vs' }});
    });

    /**
     * @param {MyDoc} $core
     */
    return ($core) => {
        const $elToolbar = createElement({
            tag: 'div',
            class: ['mydoc-tools'],
            children: [
                {
                    tag: 'span',
                    class: ['toggle'],
                    html: {
                        tag: 'span', class: ['fa', 'fa-angle-up']
                    }
                }
            ]
        }).appendTo('body');

        $(document).on('click', 'a', e => {console.log(e);
            if (!e.ctrlKey) return;
            let el = $(e.target);
            let href = el.attr('href');
            let results = href.match(/^#*(\/.*?)(?:\?(.*))*$/);
            if (!results) return;

            let path = Path.createFromString(results[1]);
            if (path.isDirectory() || $options.languages[path.ext()]) {
                showEditor({language: $options.languages[path.ext()], path: path});
                e.preventDefault();
            }
        });

        let showEditor = (options) => {
            window.require(['vs/editor/editor.main'], () => {
                const show = (options) => {
                    let overflow = $('body').css('overflow');
                    $('body').css({overflow: 'hidden'});

                    let el = $('<div class="mydoc-editor"></div>').css({top: $(document).scrollTop()}).appendTo('body');
                    let elContainer = $('<div class="mydoc-editor-container"></div>').appendTo(el);
                    let editor = monaco.editor.create(elContainer[0], $.extend($options.editor, options));

                    let destroy = () => {
                        el.remove();
                        editor.dispose();
                        $('.monaco-aria-container').remove();
                        $('body').css({overflow: overflow});
                    };

                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, () => {
                        if (options.onSave) options.onSave(editor.getValue(), () => {
                        });
                    });

                    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, (e) => {
                        if (options.onSave) options.onSave(editor.getValue(), destroy);
                    });

                    editor.addCommand(monaco.KeyCode.Escape, function () {
                        destroy();
                    });
                };

                options.onSave = (newContent, destroy) => {
                    $core.client.writeFile($core.getFilePath(options.path).toString(), newContent).done(() => {
                        if (options.path.toString() === $core.path.toString()) $core.content = newContent;
                        destroy();
                    });
                };

                if (options.value === null || options.value === undefined) {
                    $core.client.readFile($core.getFilePath(options.path).toString()).done(content => {
                        options.value = content;
                        show(options);
                    }).fail(() => {
                        options.value = '';
                        show(options);
                    });
                } else {
                    show(options);
                }
            });
        };

        $core.event.on('contentLoaded', () => {
            $elToolbar.children('ul').remove();

            let ul = createElement({tag: 'ul'}).prependTo($elToolbar);
            ul.append(createElement({
                tag: 'li',
                html: {tag: 'span', class: ['fa', 'fa-edit', 'edit']},
                attr: {
                    title: `编辑"${$core.path.toString()}"`,
                },
                on: {
                    click: () => {
                        showEditor({language: 'markdown', value: $core.content, path: $core.path});
                    }
                }
            }));
        });
    };
};