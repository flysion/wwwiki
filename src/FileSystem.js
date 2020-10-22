const fs = require('fs');
const path  = require('path');

/**
 * 获取目录的文件列表
 * @param  {string} dir 目录路径
 * @param { function } callback
 * @param  {int} max_depth 最大遍历深度 0:无限
 * @param { only_dir } 只目录
 * @param  {int} depth 当前递归深度，
 * @return {object}
 */
function list(dir, callback, max_depth = 0, only_dir = false, depth = 0) {
    if(max_depth > 0 &&  depth + 1 > max_depth) {
        return [];
    }

    let results = [];

    let files = fs.readdirSync(path.join(dir));
    for(let i = 0; i < files.length; i++) {
        let file = files[i];
        let abspath = path.join(dir, file);
        let stat = fs.statSync(path.join(dir, file));
        let fileinfo = {
            name: file, 
            path: abspath.replace('\\', '/') + (stat.isDirectory() ? '/' : ''),
            is_file: stat.isDirectory() ? false : true,
            size: stat.size,
        };

        if (callback) callback(fileinfo, file, abspath, stat, depth);

        if(stat.isDirectory()) {
            fileinfo['children'] = list(abspath, callback, max_depth, only_dir, depth + 1);
        }

        if (!only_dir || stat.isDirectory()) {
            results.push(fileinfo);
        }
    }

    return results;
}

/**
 * 删除目录
 * @param  {string}  dir
 * @param  {Boolean} recursive 是否递归删除
 * @return {void}
 */
function rmdir(dir, recursive = true) {
    fs.rmdirSync(dir, {recursive: recursive});
}

/**
 * 删除文件
 * @param  {string}  file
 * @return {void}
 */
function unlink(file) {
    fs.unlinkSync(file);
}

/**
 * 删除文件
 * @param  {string}  file
 * @param  {string}  文件内容
 * @return {void}
 */
function writeFile(file, content) {
    let dirname = path.dirname(file);

    if (!fs.existsSync(dirname)) {
        mkdir(dirname, true);
    }

    fs.writeFileSync(file, content, {encoding: 'utf8'})
}

/**
 * 创建目录
 * @param  {string}  dirname 
 * @param  {Boolean} recursive 是否递归创建
 * @return {void}
 */
function mkdir(dir, recursive = true) {
    fs.mkdirSync(dir, {recursive: recursive, mode: 0o777})
}

module.exports = {
    list: list,
    rmdir: rmdir,
    unlink: unlink,
    writeFile: writeFile,
    mkdir: mkdir,
};