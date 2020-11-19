import isArray from './isArray';
import isObject from './isObject';

const cb = (el, value, item) => value(el, item);
const attr = (el, value, item) => el.attr(value);
const data = (el, value, item) => el.data(value);
const css = (el, value, item) => el.css(value);
const text = (el, value, item) => el.text(value);
const html = (el, value, item) => el.html(createElement(value));

const cls = (el, value, item) => {
    if(isArray(value)) {
        for( let i = 0; i < value.length; i++) el.addClass(value[i]);
    } else if(isObject(value)) {
        for (let i in value) el.addClass(i);
    } else {
        el.addClass(value);
    }
};

const on = (el, value, item) => {
    if (isArray(value)) {
        for (let i = 0; i < value.length; i++) {
            el.on(value[i].name, value[i].el, value[i].data, (e) => {
                value[i].fn(e, el, item);
            });
        }
    } else if(isObject(value)) {
        for (let i in value) {
            if (typeof(value[i]) === 'function') {
                el.on(i, undefined, undefined, (e) => {
                    value[i](e, el, item);
                });

                continue;
            }

            el.on(i, value[i].el, value[i].data, (e) => {
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
    if(isObject(value)) {
        for (let i in value) {
            el.append(createElement(value[i]));
        }
    } else {
        el.append(createElement(value));
    }
};

const handles = {cb, attr, data, css, text, html, class: cls, on, children};

const createElement = function(item) {
    if(isArray(item)) {
        let els = [];

        for(let i = 0; i < item.length; i++) {
            els.push(createElement(item[i]));
        }

        return els;
    } else if (typeof(item) === 'string') {
        return $(item);
    } else if(item instanceof $) {
        return item;
    } else if(item === null) {
        return ;
    }

    let el =  $(/^[a-zA-Z0-9]+$/.test(item.tag) ? document.createElement(item.tag) : item.tag);

    for (let k in item) {
        if (k === 'tag') continue;

        if (handles[k]) {
            handles[k](el, item[k], item);
        } else {
            el.attr(k, item[k]);
        }
    }

    return el;
};

export default createElement;