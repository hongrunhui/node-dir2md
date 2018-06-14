#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const pwd = process.cwd();
const headWord = '### [dir]';
let mdName = 'readme.md';
let md = path.resolve(pwd, mdName);
const PRESTRING = '\n```\n';
const LEVEL = getArg('level') || 5;
fs.open(md, 'r', (err, fd) => {
    if (err) {
        createMd(md);
        // throw err;
    }
    readMd(md);
});


function getArg(params) {
    if (!params) {
        return '';
    }
    let args = process.argv;
    let str = args.join(' ');
    let res = '';
    let reg = new RegExp(params + ' ?= ?([^ ]*)', 'gi');
    str.replace(reg, (_, $1, $2) => {
        res = $1;
    })
    return res;
}
function createMd(path) {
    const data = `${headWord} 文件目录结构一览表\n`;
    console.log('正在为您新建readme');
    fs.writeFile(path, data, err => {
        if (err) {
            throw err;
        }
    });
}
function readMd(path) {
    fs.readFile(path, 'utf-8', (err, data) => {
        if (err) {
            throw err;
        }
        if (data.indexOf(headWord) < 0) {
            addHeadWord(path);
        }
        else {
            console.log('开始更新目录');
            updateMd(path);
        }
    });
}
function addHeadWord(path) {
    const data = `${headWord} 文件目录结构一览表\n`;
    fs.appendFile(path, data, err => {
        if (err) {
            throw err;
        }
        console.log('钩子配置成功');
    });
}

function updateMd(path) {
    let data = getCurrentDirFiles(pwd, 0);
    // console.log(data);
    drawTree(data);
}
function getCurrentDirFiles(dir, i) {
    let name = path.basename(dir);
    let item = {
        name,
        dir,
        i
    };
    let stats;
    try {
        stats = fs.statSync(dir);
    }
    catch (e) {
        return null;
    }
    let isDir = stats.isDirectory();
    if (isDir) {
        item.type = 'dir';
        let subFiles = readDir(path.resolve(dir));
        item.children = subFiles.map(child => {
            return getCurrentDirFiles(path.resolve(dir, child), i+1);
        });
    }
    else {
        item.size = stats.size;
        item.type = 'file';
        item.des = getDescription(dir);
    }

    return item;
}

function readDir(dir) {
    try {
        return fs.readdirSync(dir);
    }
    catch (e) {
        return [];
    }
}

function drawTree(obj) {
    var treeArr = [];
    const width = 20 * LEVEL;
    const sign = '└──';
    walkNodes(obj, (info) => {
        let i = info.i;
        let name = info.name;
        let des = info.des || '';
        let l = new Array(i).join('   ');
        let str = i === 0 ? `${l}${name}` : `${l}${sign}${name}`;
        let w = width - str.length <= 0 ? 5 : width - str.length;
        let r = new Array(w).join(' ');
        treeArr.push(`${str}${r}#: ${des}`);
    });
    let treeStr = PRESTRING + treeArr.join('\n') + PRESTRING;
    console.log(treeStr);
    appendTree(treeStr);
}
function walkNodes(obj, fn) {
    if (obj.i > LEVEL) {
        return;
    }
    fn && fn(obj);

    if (obj.children) {
        obj.children.forEach((item) => {
            walkNodes(item, fn);
        });
    }
}

function appendTree(data) {
    const re = /(#{3,3}\s+(?:\[dir\]).*)([\s\S]*\`{3,3}[\s\S]+?\`{3,3})?/ig;
    try {
        let fileContent = fs.readFileSync(md, 'utf-8');
        if (fileContent) {
            fileContent = fileContent.replace(re, (_, $1) => {
                if ($1) {
                    return $1 + data;
                }
            });
        }
        try {
            fs.writeFileSync(md, fileContent, 'utf-8');
        }
        catch (e) {
            throw e;
        }
    }
    catch (e) {
        throw e;
    }
}
function getDescription(dir) {
    let des = '';
    const re = /[\s\S]*@file:[\s\S]+?@description:([^@]*)(?:(\*\/))/ig;
    try {
        let fileContent = fs.readFileSync(dir, 'utf-8');
        // console.log(fileContent);
        fileContent && fileContent.replace(re, (_, $1) => {
            des = $1 && $1.replace(/\\n|\\r|\*|\s/g, '').replace(/\s+(.*)\n?/g, '$1');
        });
    }
    catch (e) {
        throw e;
    }
    return des;
}