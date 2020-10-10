const process = require('process');
const express = require('express');
const path  = require('path');
const fs = require('fs');
const urlencode = require('urlencode');

const dir = process.cwd();
const app = express();

function listdir(dirname) {
    let lists = [];

    files = fs.readdirSync(path.join(dir, dirname));
    for(let i = 0; i < files.length; i++) {
        file = files[i];

        let fileinfo = {
            filename: file, 
            path: path.join(dirname, file),
            is_file: true
        };

        stat = fs.statSync(path.join(dir, dirname, files[i]));
        if(stat.isDirectory())  {
            fileinfo['is_file'] = false;
        }

        lists.push(fileinfo);
    }

    return lists;
}

app.get('/', function(req, resp) {
    let type = req.query.type;
    switch(type) {
        case 'listdir':
            return resp.json(listdir(req.query.path));
        case undefined:
            return resp.sendFile(path.join(dir, 'index.html'));
        default:
            return resp.send('404 Not found.');
    }
});

app.get('*', function(req, resp) {
    return resp.sendFile(path.join(dir, urlencode.decode(req.path)));
});

app.listen(3000);