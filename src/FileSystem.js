const fs = require('fs');
const path  = require('path');
const pinyin = require("pinyin");

/**
 * 获取目录的文件列表
 * @param  {string} dir 目录路径
 * @param { function } filter
 * @param  {int} max_depth 最大遍历深度 0:无限
 * @param { only_dir } 只目录
 * @param  {int} depth 当前递归深度，
 * @return {object}
 */
function list(dir, filter, max_depth = 0, only_dir = false, depth = 0) {
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
            extname: stat.isDirectory() ? null : path.extname(abspath),
        };

        if (filter && !filter(fileinfo, file, abspath, stat, depth)) continue;

        if(stat.isDirectory()) {
            fileinfo['children'] = list(abspath, filter, max_depth, only_dir, depth + 1);
        }

        if (!only_dir || stat.isDirectory()) {
            results.push(fileinfo);
        }
    }

    return results;
}

module.exports = {
    list: list,
    rmdir: fs.rmdir,
    unlink: fs.unlink,
    rename: fs.rename,
    writeFile: fs.writeFile,
};