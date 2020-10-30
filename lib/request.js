/**
 * 发起http请求服务端接口
 *
 * @param type string
 * @param data object
 * @param reqOptions object $.ajax选项
 * @returns {*}
 */
export function request(type, data, reqOptions = {}) {
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
}

/**
 * 读取目录列表
 *
 * @param path string
 * @param depth int
 * @param onlyDir boolean
 * @param reqOptions object $.ajax选项
 * @returns {*}
 */
export function list(path, depth, onlyDir, reqOptions = {}) {
    return request('list', {path, depth, onlyDir}, reqOptions);
}

/**
 *  移除目录
 *
 * @param path
 * @param options
 * @param reqOptions
 * @returns {*}
 */
export function rmdir(path, options = {}, reqOptions = {}) {
    return request('rmdir', {path, options}, reqOptions);
}

/**
 *  创建目录
 *
 * @link https://nodejs.org/docs/latest-v12.x/api/fs.html#fs_fs_mkdir_path_options_callback
 * @param path
 * @param options
 * @param reqOptions
 * @returns {*}
 */
export function mkdir(path, options = {}, reqOptions = {}) {
    return request('mkdir', {path, options}, reqOptions);
}

/**
 * 删除文件
 *
 * @param path
 * @param reqOptions
 * @returns {*}
 */
export function unlink(path, reqOptions = {}) {
    return request('unlink', {path}, reqOptions);
}

/**
 * 重命名
 *
 * @param path
 * @param newPath
 * @param reqOptions
 * @returns {*}
 */
export function rename(path, newPath, reqOptions = {}) {
    return request('rename', {path, newPath}, reqOptions);
}

/**
 * 读取文件内容
 *
 * @param path
 * @param reqOptions
 * @returns {*}
 */
export function readFile(path, reqOptions) {
    return $.ajax($.extend({
        url: path,
        method: 'GET',
        headers: {
            'Accept': 'text/plain'
        }
    }, reqOptions));
}

/**
 * 写入文件
 *
 * @param path
 * @param content
 * @param options
 * @param reqOptions
 * @returns {*}
 */
export function writeFile(path, content, options, reqOptions) {
    return request('writeFile', {path, content, options}, reqOptions);
}