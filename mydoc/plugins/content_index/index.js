import __ from './../../../lib/create_element';
import './index.css';

function content_tree(el) {
    let tree = [];
    let chains = [];
    let prev = null;

    el.children('h1,h2,h3,h4,h5,h6,h7,h8,h9').toArray().forEach(child => {
        child = $(child);

        let num = parseInt(child[0].tagName.substr(1));
        let node = {
            id: child.attr('id'),
            title: child.text(),
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
        maxDepth:0,
        float: true,
        allowDirectory: false,
        defaultVisibleFloat: false,
        closeKey: 'X'
    }, $options);

    return ($event, $el) => {
        const $eContentIndex = __({
            tag: 'div',
            class: ['mydoc-content-index', $options.float ? 'mydoc-content-index-0' : 'mydoc-content-index-1']
        });

        $eContentIndex.hide();
        $el.find('.mydoc-container>.mydoc-list').after($eContentIndex);

        // 快捷关闭
        window.addEventListener('keypress', function(e) {
            if(e.key === $options.closeKey) {
                $eContentIndex.toggle();
            }
        });

        const render = (pathObj, el, items, prefix = '', depth = 1) => {
            if ($options.maxDepth > 0 && depth > $options.maxDepth) return;

            let ul = __({tag: 'ul', class: [`index-${depth}`]}).appendTo(el);

            items.forEach((item, i) => {
                let li = __({
                    tag: 'li',
                    children: [
                        {tag: 'span', class: 'num', text: `${prefix}${i+1}.`},
                        {tag: 'a', href:`#${pathObj.toString()}?id=${item.id}`, text: item.title},
                    ]
                }).appendTo(ul);

                if (item.children.length > 0) render(pathObj, li, item.children, `${prefix}${i+1}.`, depth + 1);
            });
        };

        $event.on('uiRenderContentCompleted', (pathObj) => {
            let tree = content_tree($el.find('.mydoc-container>.mydoc-content'));
            if (tree.length === 0) {
                $eContentIndex.empty().hide();
                return;
            }

            $eContentIndex.empty().show();

            if ($eContentIndex.css('position') === 'fixed' && !$options.defaultVisibleFloat) {
                $eContentIndex.hide();
            }

            render(pathObj, $eContentIndex, tree);

            if (!$options.allowDirectory && pathObj.isDirectory()) {
                $eContentIndex.hide();
            }
        });
    };
};