const process = require('process');
const express = require('express');
const path  = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const urlencode = require('urlencode');
const fileSystem = require('./FileSystem.js');

function start(options) {
    options.root = path.resolve(options.root);

    /**
     * 获取相对于工作目录的绝对路径，并判断路径是否超出了工作目录
     * 
     * @param  {string} name 目录或文件路径
     * @return {string} 目录或文件的绝对路径
     */
    const resolve = (...name) => {
        let abspath = path.join(options.root, ...name);
        if (abspath.substr(0, options.root.length) !== options.root) {
            throw new Error(`非法的文件路径`);
        }

        return abspath;
    }

    /**
     * 验证用户授权
     * @param  {req} req
     * @return {boolean}
     */
    const auth = (req) => {
        var authorization = req.header('authorization');
        if(authorization) {
            var account = Buffer.from(authorization.substr(6), 'base64').toString().split(':');
            if(account[0] === options.username && account[1] === options.password) {
                return true;
            }
        }

        return false;
    }

    const routes = {
        'list': (req, resp) => {
            resp.json(fileSystem.list(resolve(req.body.path), (fileinfo, file, abspath, stat, depth) => {
                fileinfo.path = fileinfo.path.substr(options.root.length);
                return true;
            }, req.body.depth, req.body.onlyDir));
        },

        'rmdir': (req, resp) => {
            fileSystem.rmdir(resolve(req.body.path), req.body.options, err => {
                if (err) throw err;
                resp.json({});
            });
        },

        'unlink': (req, resp) => {
            fileSystem.unlink(resolve(req.body.path), err => {
                if (err) throw err;
                resp.json({});
            });
        },

        'rename': (req, resp) => {
            fileSystem.rename(resolve(req.body.path), resolve(req.body.newPath), err => {
                if (err) throw err;
                resp.json({});
            });
        },

        'writeFile': (req, resp) => {
            fileSystem.writeFile(resolve(req.body.path), req.body.content, req.body.options, err => {
                if (err) throw err;
                resp.json({});
            });
        }
    };

    /**
     * express
     * @type express
     */
    const app = express();

    // 为项目设置密码
    if(options.username) {
        app.use(function(req, resp, next) {
            if (auth(req)) {
                next();
                return;
            }

            resp.header('WWW-Authenticate', 'Basic realm="xxx"');
            resp.sendStatus(401);
        });
    }

    // 加载首页
    app.get('/', function(req, resp) {
        resp.sendFile(path.join(options.root, options.indexFile));
    });

    app.use(express.static(options.root));
    app.use('/docsite/themes', express.static(path.join(__dirname, '../themes')));
    app.use('/docsite', express.static(path.join(__dirname, '../lib')));
    app.use(bodyParser.json({limit: '1mb'}));
    app.use(bodyParser.urlencoded({extended: true}));

    // 功能接口
    app.post('/', function(req, resp) {
        let type = req.query.type;
        if(routes[type] !== undefined) {
            try {
                routes[type](req, resp);
            } catch(err) {
                resp.status(500).json({message: err.message});
            }
        } else {
            resp.status(404).send('404 Not found.');
        }
    });

    app.listen(options.port);
}

module.exports = {
    start: start
};