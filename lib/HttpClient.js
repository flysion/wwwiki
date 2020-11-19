import Path from "./Path";

export default class HttpClient {
    constructor() {

    }

    request (type, data, reqOptions = {}) {
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

    tree (path, depth, onlyDir, reqOptions = {}) {
        return this.request('tree', {
            path: path instanceof Path ? path.toString() : path,
            depth,
            onlyDir
        }, reqOptions);
    };

    rmdir (path, options = {}, reqOptions = {}) {
        return this.request('rmdir', {
            path: path instanceof Path ? path.toString() : path,
            options
        }, reqOptions);
    };

    mkdir (path, options = {}, reqOptions = {}) {
        return this.request('mkdir', {
            path: path instanceof Path ? path.toString() : path,
            options
        }, reqOptions);
    };

    unlink (path, reqOptions = {}) {
        return this.request('unlink', {
            path: path instanceof Path ? path.toString() : path
        }, reqOptions);
    };

    rename (path, newPath, reqOptions = {}) {
        return this.request('rename', {
            path: path instanceof Path ? path.toString() : path,
            newPath: newPath instanceof Path ? newPath.toString() : newPath
        }, reqOptions);
    };

    readFile (path, reqOptions) {
        return $.ajax($.extend({
            url: path instanceof Path ? path.toString() : path,
            method: 'GET',
            headers: {
                'Accept': 'text/plain'
            }
        }, reqOptions));
    };

    writeFile (path, content, options, reqOptions) {
        return this.request('writeFile', {
            path: path instanceof Path ? path.toString() : path,
            content,
            options
        }, reqOptions);
    };
}