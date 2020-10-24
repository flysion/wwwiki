"use strict";

(function(window) {
    window.$docsite = {};

    var apiRequest = function (type, data, reqOptions) {
        return $.ajax($.extend({
            url: `/?type=${type}`,
            method: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }, reqOptions));
    };

    window.$docsite.loadStyle = function(url, callback) {
    　　var style = document.createElement('link');
        style.rel = 'stylesheet';
        style.type = 'text/css';
        style.href = url;
        if (callback) style.onload = callback;

        document.getElementsByTagName('head')[0].appendChild(style);
    };

    window.$docsite.loadScript = function(url, callback) {
    　　var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        if (callback) script.onload = callback;

        document.getElementsByTagName('head')[0].appendChild(script);
    };

    window.$docsite.createElement = (function () {
        const cb = (el, value, item) => value(el, item);
        const attr = (el, value, item) => el.attr(value);
        const data = (el, value, item) => el.data(value);
        const css = (el, value, item) => el.css(value);
        const text = (el, value, item) => el.text(value);
        const html = (el, value, item) => el.html(value);
        
        const cls = (el, value, item) => {
            if(Array.isArray(value)) {
                for( let i = 0; i < value.length; i++) el.addClass(value[i]);
            } else {
                el.addClass(value);
            }
        };
        
        const on = (el, value, item) => {
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    el.on(value[i].name, value[i].el, value[i].data, (e) => {
                        value[i].fn(e, el, item);
                    });
                }
            } else {
                el.on(value.name, value.el, value.data, (e) => {
                    value.fn(e, el, item);
                });
            }
        };
        
        const children = (el, value, item) => {
            for (let i = 0; i < value.length; i++) {
                el.append(window.$docsite.createElement(value[i]));
            }
        };
        
        const handle = {cb, attr, data, css, text, html, class: cls, on, children};
        
        return function(item) {
            if(Array.isArray(item)) {
                let els = [];
                
                for(let i = 0; i < item.length; i++) {
                    els.push(window.$docsite.createElement(item[i]));
                }
                
                return els;
            } else if (typeof(item) === 'string') {
                return $(item);
            } else if(item instanceof $) {
                return item;
            }
            
            let el =  $(/^[a-zA-Z0-9]+$/.test(item.tag) ? document.createElement(item.tag) : item.tag);
            
            for (let k in item) {
                if (k === 'tag') continue;
                
                if (handle[k]) {
                    handle[k](el, item[k], item);
                }
            }
            
            return el;
        }
    }) ();

    window.$docsite.fileSystem = {
        list: (path, depth, onlyDir, reqOptions) => {
            return apiRequest('list', {path, depth, onlyDir}, reqOptions);
        },
        rmdir: (path, options, reqOptions) => {
            return apiRequest('rmdir', {path, options}, reqOptions);
        },
        unlink: (path, reqOptions) => {
            return apiRequest('unlink', {path}, reqOptions);
        },
        rename: (path, newPath, reqOptions) => {
            return apiRequest('rename', {path, newPath}, reqOptions);
        },
        readFile: (path, reqOptions) => {
            return $.ajax($.extend({
                url: path,
                method: 'GET',
                headers: {
                    'Accept': 'text/plain'
                }
            }, reqOptions));
        },
        writeFile: (path, content, options, reqOptions) => {
            return apiRequest('writeFile', {path, content, options}, reqOptions);
        }
    };
}) (window);