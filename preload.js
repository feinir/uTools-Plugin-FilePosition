var fs = require("fs");
var path = require('path');
var exec = require('child_process').exec;

window.exports = {
    "go": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list",  // 列表模式
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
                // 如果进入插件就要显示列表数据
                itemes = [];

                exec('wmic logicaldisk get caption', function (err, stdout, stderr) {
                    if (!(err || stderr)) {
                        stdoutStr = stdout;
                        console.log(stdoutStr);
                        var outStrArray = stdoutStr.split("\n");
                        console.log(outStrArray[0] + " : " + outStrArray.length);
                        for (i = 1; i < outStrArray.length; i++) {
                            if (outStrArray[i].trim().length > 1) {
                                itemes.push({
                                    title: outStrArray[i].trim(),
                                    description: '在此分区内查找',
                                    icon: 'logo.png', // 图标(可选)
                                    url: outStrArray[i].trim(),
                                    isParent: false,
                                    isDir: true
                                });
                                console.log("add:" + outStrArray[i]);
                                callbackSetList(itemes);
                            }
                        }
                    }
                });

                console.log("itemes len:" + itemes.length);

            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                // 获取一些数据
                // 执行 callbackSetList 显示出来
                var pett = /^"?[C-Zc-z]:[^:*?"<>|\f\n\r\t\v]*"?$/;
                if (!pett.test(searchWord)) {
                    itemes = [];
                    exec('wmic logicaldisk get caption', function (err, stdout, stderr) {
                        if (!(err || stderr)) {
                            stdoutStr = stdout;
                            console.log(stdoutStr);
                            var outStrArray = stdoutStr.split("\n");
                            console.log(outStrArray[0] + " : " + outStrArray.length);
                            for (i = 1; i < outStrArray.length; i++) {
                                if (outStrArray[i].trim().length > 1) {
                                    itemes.push({
                                        title: outStrArray[i].trim(),
                                        description: '在此分区内查找',
                                        icon: 'logo.png', // 图标(可选)
                                        url: outStrArray[i].trim(),
                                        isParent: false,
                                        isDir: true
                                    });
                                    console.log("add:" + outStrArray[i]);
                                    callbackSetList(itemes);
                                }
                            }
                        }
                    });
                    return;
                }
                var pett2 = /^"?[C-Zc-z]:$/;
                var findWord = searchWord;
                if (pett2.test(findWord)) {
                    findWord = findWord + "\\";
                } else {

                }
                fs.stat(findWord, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        console.log('文件夹存在');
                        var itemes = [];

                        //先把文件夹本身放到第一条
                        var f = {
                            title: findWord,
                            description: "在资源管理器中打开",
                            icon: 'logo.png',
                            url: findWord,
                            isParent: true,
                            isDir: true
                        };
                        itemes.push(f);
                        callbackSetList(itemes);

                        fs.readdir(findWord, function (err, files) {
                            if (!err) {
                                files.forEach(function (filename) {
                                    var filedir = path.join(findWord, filename);
                                    fs.stat(filedir, function (eror, stats) {
                                        if (!eror) {
                                            var isDir = stats.isDirectory();//是文件夹
                                            if (isDir) {
                                                console.log(filedir);
                                                var f = {
                                                    title: filename,
                                                    description: filedir,
                                                    icon: 'logo.png',
                                                    url: filedir,
                                                    isParent: false,
                                                    isDir: true
                                                };
                                                itemes.push(f);
                                                callbackSetList(itemes);
                                                if (itemes.length >= 10) {
                                                    return;
                                                }
                                            }
                                        }
                                    });
                                });
                            }
                        });
                        var StartTime = new Date().getTime();
                        while ((new Date().getTime() < StartTime + 1000) && (itemes.length <= 2));
                        fs.readdir(findWord, function (err, files) {
                            if (!err) {
                                files.forEach(function (filename) {
                                    var filedir = path.join(findWord, filename);
                                    fs.stat(filedir, function (eror, stats) {
                                        if (!eror) {
                                            var isFile = stats.isFile();//是文件
                                            if (isFile) {
                                                console.log(filedir);
                                                var f = {
                                                    title: filename,
                                                    description: filedir,
                                                    icon: 'file.png',
                                                    url: filedir,
                                                    isParent: false,
                                                    isDir: false
                                                };
                                                itemes.push(f);
                                                callbackSetList(itemes);
                                                if (itemes.length >= 10) {
                                                    return;
                                                }
                                            }
                                        }
                                    });
                                });
                            }
                        });

                    } else if (stat && stat.isFile()) {
                        //文件
                        console.log('文件存在');
                        var itemes = [];
                        var f = {
                            title: findWord,
                            description: "在资源管理器中定位此文件",
                            icon: 'logo.png',
                            url: findWord,
                            isParent: true,
                            isDir: false
                        };
                        itemes.push(f);
                        callbackSetList(itemes);
                    } else {
                        //非文件
                        console.log('输入的路径不是现存的文件！');
                        index = findWord.lastIndexOf("\\");
                        if ((index <= 0) || (index >= findWord.length - 1)) return;
                        var parentPath = findWord.substring(0, index + 1);
                        var keyWord = findWord.substring(index + 1, findWord.length);
                        if (keyWord.length <= 0) return;
                        var itemes = [];
                        fs.stat(parentPath, function (eror, stats) {
                            if (!eror) {
                                if (stats.isDirectory()) {
                                    fs.readdir(parentPath, function (err, files) {
                                        if (!err) {
                                            files.forEach(function (filename) {
                                                if (filename.toLowerCase().indexOf(keyWord.toLowerCase()) >= 0) {
                                                    //key workd in filename 
                                                    var filedir = path.join(parentPath, filename);
                                                    fs.stat(filedir, function (eror, stats) {
                                                        if (!eror) {
                                                            var isDir = stats.isDirectory();//是文件夹
                                                            if (isDir) {
                                                                console.log(filedir);
                                                                var f = {
                                                                    title: filename,
                                                                    description: filedir,
                                                                    icon: 'logo.png',
                                                                    url: filedir,
                                                                    isParent: false,
                                                                    isDir: true
                                                                };
                                                                itemes.push(f);
                                                                callbackSetList(itemes);
                                                                if (itemes.length >= 10) {
                                                                    return;
                                                                }
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                    while ((new Date().getTime() < StartTime + 1000) && (itemes.length <= 2));
                                    fs.readdir(parentPath, function (err, files) {
                                        if (!err) {
                                            files.forEach(function (filename) {
                                                if (filename.toLowerCase().indexOf(keyWord.toLowerCase()) >= 0) {
                                                    var filedir = path.join(parentPath, filename);
                                                    fs.stat(filedir, function (eror, stats) {
                                                        if (!eror) {
                                                            var isFile = stats.isFile();//是文件
                                                            if (isFile) {
                                                                console.log(filedir);
                                                                var f = {
                                                                    title: filename,
                                                                    description: filedir,
                                                                    icon: 'file.png',
                                                                    url: filedir,
                                                                    isParent: false,
                                                                    isDir: false
                                                                };
                                                                itemes.push(f);
                                                                callbackSetList(itemes);
                                                                if (itemes.length >= 10) {
                                                                    return;
                                                                }
                                                            }
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                });

            },
            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                if (!itemData.isDir) {
                    window.utools.hideMainWindow();
                    const url = itemData.url;
                    window.utools.shellShowItemInFolder(url);
                    window.utools.outPlugin();
                } else if (itemData.isParent) {
                    window.utools.hideMainWindow();
                    const url = itemData.url;
                    window.utools.shellShowItemInFolder(url);
                    window.utools.outPlugin();
                } else {
                    window.utools.setSubInputValue(itemData.url + "\\");
                }
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索"
        }
    }
}