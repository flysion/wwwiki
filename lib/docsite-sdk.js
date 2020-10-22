var docsite = {};

docsite.api = function (type, data, options) {
    return $.ajax($.extend({
        url: `/?type=${type}`,
        method: 'POST',
        dataType: 'json',
        data: JSON.stringify(data),
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }, options));
};

docsite.writeFile = function (path, content, options) {
    return $.ajax($.extend({
        url: path,
        method: 'POST',
        dataType: 'json',
        data: content,
        headers: {
            'Content-Type': 'text/plain',
        }
    }, options));
};

docsite.readFile = function (path, options) {
    return $.ajax($.extend({
        url: path,
        method: 'GET',
        headers: {
            'Content-Type': 'text/plain',
        }
    }, options));
};

docsite.getOptions = function() {
    var options = {onlyRead: true};

    $.ajax({
        url: '/docsite/options',
        method: 'GET',
        dataType: 'json',
        async: false,
    }).done(resp => {
        options = $.extend(options, resp);
    });

    return options;
};