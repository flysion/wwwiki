const express = require('express');
const path = require('path');
const process = require('process');
const bodyParser = require('body-parser');
const FileSystem = require('./FileSystem.js');

function start(options) {
    process.chdir(options.root);
    fileSystem = new FileSystem(options.root);

    /**
     * 验证用户授权
     * @param  {req} req
     * @return {boolean}
     */
    const auth = (req) => {
        let authorization = req.header('authorization');
        if(authorization) {
            let account = Buffer.from(authorization.substr(6), 'base64').toString().split(':');
            if(account[0] === options.username && account[1] === options.password) {
                return true;
            }
        }

        return false;
    };

    const routes = {
        'tree': (req, resp) => {
            resp.json(fileSystem.tree(req.body.path, req.body.depth, req.body.onlyDir));
        },

        'rmdir': (req, resp) => {
            fileSystem.rmdir(req.body.path, req.body.options, err => {
                if (err) throw err;
                resp.json({});
            });
        },

        'mkdir': (req, resp) => {
            fileSystem.mkdir(req.body.path, req.body.options, err => {
                if (err) throw err;
                resp.json({});
            });
        },

        'unlink': (req, resp) => {
            fileSystem.unlink(req.body.path, err => {
                if (err) throw err;
                resp.json({});
            });
        },

        'rename': (req, resp) => {
            fileSystem.rename(req.body.path, resolve(req.body.newPath), err => {
                if (err) throw err;
                resp.json({});
            });
        },

        'writeFile': (req, resp) => {
            fileSystem.writeFile(req.body.path, req.body.content, req.body.options, err => {
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
    app.use('/docsite', express.static(path.join(__dirname, '../dist')));
    app.use(bodyParser.json({limit: '1mb'}));
    app.use(bodyParser.urlencoded({extended: true}));

    // 功能接口
    app.post('/', function(req, resp) {
        let type = req.query.type;
        if(routes[type] !== undefined) {
            try {
                routes[type](req, resp);
            } catch(err) {
                throw err;
                //resp.status(500).json({message: err.message});
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