import __ from './../../../lib/create_element';
import './index.css';

function getContentIndexTree(el) {
    let tree = [];
    let chains = [];
    let prev = null;

    let headers = el.children('h1,h2,h3,h4,h5,h6,h7,h8,h9').toArray();

    headers.forEach(header => {
        header = $(header);

        let num = parseInt(header[0].tagName.substr(1));
        let node = {
            id: header.attr('id'),
            title: header.text(),
            el: header,
            num: num,
            children: []
        };

        if(prev === null) {
            tree.push(node);
        } else if(num > prev.num) {
            prev.children.push(node);
            chains.push(prev);
        } else if(num === prev.num) {
            if(chains.length === 0) {
                tree.push(node);
            } else {
                chains[chains.length - 1].children.push(node);
            }
        } else {
            do {
                var sibling = chains.pop();
            } while(sibling !== undefined && sibling.num > num);

            if(chains.length === 0) {
                tree.push(node);
            } else {
                chains[chains.length - 1].children.push(node);
            }
        }

        prev = node;
    });

    return tree;
}

window.ContentIndex = function($options) {
    $options = $.extend({
        maxDepth: 0, // 最大深度
        float: true, // 浮动状态还是固定状态（移动端强制为固定状态）
        allowDirectory: true, // 目录状态下是否启用，如果不启用的话仍然会生成文章索引，但是默认不显示
        closeKey: 'x', // ctrl+快捷键关闭（隐藏文章索引）
        floatKey: 'z', // ctrl+浮动状态与固定状态的切换（移动端强制为固定状态，不可切换）
        skipTop: false, // 跳过最顶级标题
        onlyOneHide: true, // 只有一个标题时不显示
        getOptions: (path, tree) => {
            return {};
        }
    }, $options);

    /**
     * @param {MyDoc}
     */
    return ($core) => {
        const $el = __({
            tag: 'div',
            class: ['mydoc-content-index', $options.float ? 'float' : ''],
        });

        $el.hide();
        $core.elList.after($el);

        // 获取当前索引

        const current = (top) => {
            let indexes = $el.find('li');

            let prev = null;
            for(let i = indexes.length - 1; i >= 0; i--) {
                let index = $(indexes[i]);
                let target = index.data('target');
                if (target.offset().top <= top) {
                    return prev ? prev : index;
                }

                prev = index;
            }

            return $($el.find('li')[0]);
        };

        // 根据滚动条高亮当前索引

        const highlightCurrent = () => {
            let top = $(window).scrollTop();
            $el.find('li.current').removeClass('current');
            let currentIndex = current(top);
            currentIndex.addClass('current');
        };

        // 快捷键

        $(document).keyup(e => {
            if(e.ctrlKey && e.key === $options.floatKey) {
                $el.hasClass('float') ? $el.removeClass('float') : $el.addClass('float');
                $el.show();
            } else if(e.ctrlKey && e.key === $options.closeKey) {
                $el.toggle();
            }
        });

        // 监听滚动位置

        let pid = 0;
        $(window).on('scroll', e => {
            if (pid > 0) clearTimeout(pid);
            pid = setTimeout(highlightCurrent, 30);
        });

        const render = (options, path, el, items, prefix = '', depth = 1) => {
            if (options.maxDepth > 0 && depth > options.maxDepth) return;

            let ul = __({tag: 'ul', class: [`index-${depth}`]}).appendTo(el);
            items.forEach((item, i) => {
                let li = __({
                    tag: 'li',
                    data: {
                        target: item.el
                    },
                    children: [
                        {tag: 'span', class: 'num', text: `${prefix}${i+1}.`},
                        {tag: 'a', href:`#${path.toString()}?id=${item.id}`, text: item.title},
                    ]
                }).appendTo(ul);

                if (item.children.length > 0) {
                    render(options, path, li, item.children, `${prefix}${i+1}.`, depth + 1);
                }
            });
        };

        $core.event.on('contentReloaded', (path) => {
            $el.empty();

            let tree = getContentIndexTree($core.elContent);
            let options = $.extend($options, $options.getOptions(path, tree));
            // 跳过最顶级标题
            if (options.skipTop) tree = tree.length === 1 ? tree[0].children : tree;
            if (tree.length === 0) {
                $el.hide();
                return;
            }

            render(options, path, $el, tree);
            highlightCurrent();

            if (options.hide) {
                $el.hide();
                return;
            }

            if (options.show) {
                $el.show();
                return;
            }

            let show = true;

            // 是否在目录下显示
            if (!options.allowDirectory && path.isDirectory()) {
                show = false;
            }

            // 只有一个标题时不显示
            if (options.onlyOneHide && tree.length === 1 && tree[0].children.length === 0) {
                show = false;
            }

            show ? $el.show() : $el.hide();
        });
    };
};