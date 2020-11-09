const fs = require('fs');
const path  = require('path');

class FileSystem {
    constructor(root) {
        this.root = path.resolve(root);
    }

    /**
     * 获取相对于工作目录的绝对路径
     * 会判断路径是否超出了工作目录
     *
     * @param  {string} name 目录或文件路径
     * @return {string} 目录或文件的绝对路径
     */
    resolve(...name) {
        let abspath = path.join(this.root, ...name);
        if (abspath.substr(0, this.root.length) !== this.root) {
            throw new Error(`非法的文件路径`);
        }

        return abspath;
    };

    /**
     * 获取目录的文件列表
     * @param  {string} dir 目录路径
     * @param  {int} maxDepth 最大递归深度 0:无限
     * @param { bool } onlyDir 只目录
     * @return {object}
     */
    tree(dir, maxDepth = 0, onlyDir = false) {
        let _tree = (dir, maxDepth, onlyDir, depth) => {
            if(maxDepth > 0 &&  depth + 1 > maxDepth) return [];

            let results = [];

            fs.readdirSync(this.resolve(dir)).forEach(file => {
                let abspath = this.resolve(dir, file);
                let fullpath = path.join(dir, file);

                let stat = fs.statSync(abspath);

                let is_file = !stat.isDirectory();
                let extname = is_file ? path.extname(file) : null;
                let basename = path.basename(fullpath);
                let dirname = path.dirname(fullpath); dirname = dirname === '/' ? dirname : dirname + '/';

                let fileinfo = {
                    is_file, extname, basename, dirname,
                    path: fullpath.replace('\\', '/') + (stat.isDirectory() ? '/' : ''),
                    size: stat.size,
                    atime: stat.atime,
                    mtime: stat.mtime,
                    ctime: stat.ctime,
                };

                if(!is_file) {
                    fileinfo.children = _tree(fullpath, maxDepth, onlyDir, depth + 1);
                }

                if (!onlyDir || stat.isDirectory()) {
                    results.push(fileinfo);
                }
            });

            return results;
        };

        return _tree(dir, maxDepth, onlyDir, 0);
    }

    /**
     * 删除目录
     *
     * @see fs.rmdir
     * @param path
     * @param options
     * @param callback
     */
    rmdir(path, options, callback) {
        fs.rmdir(this.resolve(path), options, callback);
    }

    mkdir(path, options, callback) {
        fs.mkdir(this.resolve(path), options, callback);
    }

    unlink(path, callback) {
        fs.unlink(this.resolve(path), callback);
    }

    rename(path, new_path, callback) {
        fs.unlink(this.resolve(path), this.resolve(new_path), callback);
    }

    writeFile(path, content, options, callback) {
        fs.writeFile(this.resolve(path), content, options, callback);
    }
}

module.exports = FileSystem;