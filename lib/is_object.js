import isArray from './is_array';

function isObject(val) {
    return val != null && typeof val === 'object' && isArray(val) === false;
}

export default isObject;