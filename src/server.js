const process = require('process');
const express = require('express');
const path  = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const urlencode = require('urlencode');
const fileSystem = require('./FileSystem.js');

function server(options) {
    options.root = path.resolve(options.root);

    /**
     * 获取相对于工作目录的绝对路径，并判断路径是否超出了工作目录
     * 
     * @param  {string} name 目录或文件路径
     * @return {string} 目录或文件的绝对路径
     */
    var resolve = (...name) => {
        let abspath = path.join(options.root, ...name);
        if (abspath.substr(0, options.root.length) !== options.root) {
            throw new Error(`非法的文件路径`);
        }

        return abspath;
    }

    const app = express();

    // 为项目设置密码
    if(options.username) {
        app.use(function(req, resp, next) {
            var authorization = req.header('authorization');
            if(authorization) {
                var account = Buffer.from(authorization.substr(6), 'base64').toString().split(':');
                if(account[0] === options.username && account[1] === options.password) {
                    next()
                    return;
                }
            }

            resp.header('WWW-Authenticate', 'Basic realm="xxx"');
            resp.sendStatus(401);
            return;
        });
    }

    app.use(express.static(options.root));
    app.use('/docsite/themes', express.static(path.join(__dirname, '../themes')));
    app.use('/docsite', express.static(path.join(__dirname, '../lib')));
    app.use(bodyParser.json({limit: '1mb'}));
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // 读取服务选项
    app.get('/docsite/options', function(req, resp) {
        resp.json({onlyRead: options.onlyRead});
    });

    // 加载首页
    app.get('/', function(req, resp) {
        resp.sendFile(path.join(options.root, 'index.html'));
    });

    // 功能接口
    app.post('/', function(req, resp) {
        let type = req.query.type;

        switch(type) {
            case 'list':
                return resp.json(fileSystem.list(resolve(req.body.path), (fileinfo, file, abspath, stat, depth) => {
                    fileinfo.path = fileinfo.path.substr(options.root.length);
                }, req.body.depth || 0, req.body.only_dir || false));
            case 'rmdir':
                fileSystem.rmdir(resolve(req.body.path));
                return resp.json({result: true});
            case 'unlink':
                fileSystem.unlink(resolve(req.body.path));
                return resp.json({result: true});
            default:
                resp.status(404);
                resp.json('404 Not found.');
        }
    });

    if(!options.onlyRead) {
        // 写入文件
        app.post('*', function(req, resp) {
            var data = '';
            req.setEncoding('utf8');
            req.on('data', function(chunk) {
                data += chunk;
            });

            req.on('end', function() {
                fileSystem.writeFile(resolve(urlencode.decode(req.path)), data);
            });

            resp.json({result: true});
        });
    }

    app.listen(options.port);
}

module.exports = {
    server: server
};