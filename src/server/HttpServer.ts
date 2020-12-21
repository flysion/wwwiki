const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

class HttpServer
{
    app: any;
    options: HttpServerOptions;
    fs: FileSystem;

    constructor(options: HttpServerOptions, fs: FileSystem)
    {
        this.app = express();
        this.options = options;
        this.fs = fs;
    }

    checkAuth(req): boolean
    {
        let authorization = req.header('authorization');

        if(authorization) {
            let account = Buffer.from(authorization.substr(6), 'base64').toString().split(':');
            return (account[0] === this.options.username && account[1] === this.options.password);
        }

        return false;
    }

    start()
    {
        this.app.use(bodyParser.json({limit: '1mb'}));
        this.app.use(bodyParser.urlencoded({extended: true}));

        // 验证用户名密码

        if (this.options.username) {
            this.app.use((req, resp, next) => {
                if (this.checkAuth(req)) return next();
                resp.header('WWW-Authenticate', 'Basic realm="xxx"');
                resp.sendStatus(401);
            });
        }

        // 加载首页

        this.app.get('/', (req, resp) => {
            this.fs.readFile(this.options.indexFile, null, content => {
                resp.send(content);
            });
        });

        // 加载静态资源

        this.app.use(express.static(this.options.root));

        // 加载库资源

        this.app.use('/docsite', express.static(path.join(__dirname, '../dist')));

        // 功能接口

        this.app.post('/', function(req, resp) {
            switch(req.query.type) {
                case 'listdir':
                    break;
                case 'mkdir':
                    break;
                case 'rmdir':
                    break;
                case 'renameDir':
                    break;
                case 'writeFile':
                    break;
                case 'readFile':
                    break;
                case 'renameFile':
                    break;
                case 'unlink':
                    break;
                default:
                    resp.status(404).send('404 Not found.');
            }
        });

        this.app.listen(this.options.port || 3000);
    }
}