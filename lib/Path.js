export default class Path {
    constructor(info) {
        this.info = info;
    }

    isFile() {
        return this.info.is_file;
    }

    isDirectory() {
        return !this.isFile();
    }

    isRoot() {
        return this.info.path === '/';
    }

    extname() {
        return this.info.extname;
    }

    ext() {
        return this.info.extname.substr(1).toLowerCase();
    }

    basename() {
        return this.info.basename;
    }

    dirname() {
        return this.info.dirname;
    }

    segments() {
        let path = this.toString();
        let segments = [];

        for(let i = 0; i < path.length; i++) {
            if(path[i] === '/' || i === path.length - 1) {
                segments.push(Path.createFromString(path.substr(0, i + 1)));
            }
        }

        return segments;
    }

    join(name) {
        return this.isFile() ? Path.createFromString(`${this.dirname()}${name}`) : Path.createFromString(`${this.toString()}${name}`);
    }

    toString() {
        return this.info.path;
    }
}

Path.createFromString = path => {
    path = Path.resolve(path);

    let info = {
        path: path,
    };

    info.is_file = path.substr(-1) !== '/';
    info.extname = info.is_file ? path.substr(path.lastIndexOf('.')) : null;

    path = info.is_file ? path : path.substr(0, path.length - 1);

    info.basename = path.substr(path.lastIndexOf('/') + 1);
    info.dirname = path.substr(0, path.lastIndexOf('/') + 1);

    return new Path(info);
};

/**
 * 将路径标准化
 *
 * @param {string} path 一个以 / 开头的绝对路径
 */
Path.resolve = path => {
    let pathArr = [];

    let segments = path.split('/');
    for (let i = 0; i < segments.length; i++) {
        let segment = segments[i];
        if (segment === '' || segment === '.') {
            continue;
        }

        if (segment === '..') {
            pathArr.pop();
            continue;
        }

        pathArr.push(segment);
    }

    return `/${pathArr.join('/')}${pathArr.length > 0 && path.substr(-1) === '/' ? '/' : ''}`;
};