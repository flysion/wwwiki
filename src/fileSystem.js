const fs = require('fs');
const path  = require('path');

/**
 * 获取目录的文件列表
 * @param  {string} dir 目录路径
 * @param { function } formatPath
 * @param  {int} maxDepth 最大遍历深度 0:无限
 * @param { onlyDir } 只目录
 * @param  {int} depth 当前递归深度，
 * @return {object}
 */
function list(dir, formatPath, maxDepth = 0, onlyDir = false, depth = 0) {
    if(maxDepth > 0 &&  depth + 1 > maxDepth) return [];

    let results = [];

    fs.readdirSync(dir).forEach(file => {
        let fullpath = path.join(dir, file);
        let stat = fs.statSync(fullpath);
        let fileinfo = {
            path: fullpath.replace('\\', '/') + (stat.isDirectory() ? '/' : ''),
        };

        if (formatPath) {
            fileinfo.path = formatPath(fileinfo.path, stat);
        }

        if(stat.isDirectory()) {
            fileinfo.children = list(fullpath, formatPath, maxDepth, onlyDir, depth + 1);
        }

        if (!onlyDir || stat.isDirectory()) {
            results.push(fileinfo);
        }
    });

    return results;
}

module.exports = {
    list: list,
    rmdir: fs.rmdir,
    mkdir: fs.mkdir,
    unlink: fs.unlink,
    rename: fs.rename,
    writeFile: fs.writeFile,
};