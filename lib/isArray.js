let toString = {}.toString;

let isArray = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
};

export default isArray;