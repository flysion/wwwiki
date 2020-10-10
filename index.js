const process = require('process');
const express = require('express');
const path  = require('path');
const fs = require('fs');

const dir = process.cwd();
const app = express();

function renderIndex(req, resp) {
    resp.sendFile(path.join(dir, 'index.html'));
}

function openMarkdown(req, resp) {
    resp.send(fs.readFileSync(path.join(dir, req.query.path)))
}

function openDir(req, resp) {
    let lists = [];

    files = fs.readdirSync(path.join(dir, req.query.path));
    for(let i = 0; i < files.length; i++) {
        file = files[i];

        stat = fs.statSync(path.join(dir, req.query.path, files[i]));

        if(stat.isDirectory())  {
            lists.push({filename: file, is_dir: true});
        } else {
            lists.push({filename: file, is_dir: false, mtime: stat.mtime});
        }
    }

    resp.json(lists);
}

app.get('/', function(req, resp){
	const type = req.query.type

    switch(type) {
        case 'open':
            return openMarkdown(req, resp);
        case 'open-dir':
            return openDir(req, resp);
        default:
            return renderIndex(req, resp);
    }
});

app.listen(3000);