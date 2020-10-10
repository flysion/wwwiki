document.write('<script src="//cdn.jsdelivr.net/npm/jquery@3.2/dist/jquery.min.js"></script>');
document.write('<script src="//cdn.jsdelivr.net/npm/marked/marked.min.js"></script>');

window.$wwwiki = window.$wwwiki || {};

function eachTokens(tokens) {
    for(let i = 0; i < tokens.length; i++) {
        let token = tokens[i];

        if(token.type === 'link') {
            if(token.href.substr(0,3) === '//:' || token.href[0] !== '/') {
                continue;
            }

            let i = token.href.indexOf('#');

            if (i === -1) {
                if(token.href.substr(-3) === '.md'/* markdown file */ || token.href.substr(-1) === '/'/* dir */) {
                    token.href = `#${token.href}`;
                }

                continue;
            }

            let section = token.href.substr(0, i);
            let anchor = token.href.substr(i + 1);

            if(section.substr(-3) === '.md'/* markdown file */ || section.substr(-1) === '/'/* dir */) {
                token.href = `#${section}?id=${anchor}`;
            }
        } else if(token.type === 'list' && token['items']) {
            eachTokens(token.items);
        } else if(token['tokens']) {
            eachTokens(token.tokens);
        }
    }
}

function markdown2html(text) {
    const tokens = marked.lexer(text);
    eachTokens(tokens);
    return marked.parser(tokens);
}

function loadFile(path) {
    $.get(path, (resp) => {
        window.$wwwiki['onLoadFile'] && window.$wwwiki['onLoadFile'](path, markdown2html(resp));
    })
}

function loadDir(path) {
    $.getJSON('/', {type: 'listdir', path: decodeURIComponent(path)}, (resp) => {console.log(window.$wwwiki);
        window.$wwwiki['onLoadDir'] && window.$wwwiki['onLoadDir'](path, resp);
    })
}

function load() {
    let hash = window.location.hash;
    if(hash === '') {
        loadFile('/README.md');
        loadDir('/');
        return;
    }

    let section = hash.substr(1);
    let i = section.indexOf('?');
    if(i > 0) {
        section = section.substr(0, i);
    }

    if(section.substr(-1) === '/'/* dir */) {
        loadFile(section + 'README.md');
        loadDir(section);
    } else {
        loadFile(section);
    }
}

function ready() {
    load();
    $(window).on('hashchange', load);
}

window.onload = function() {
    $(document).ready(ready);
};