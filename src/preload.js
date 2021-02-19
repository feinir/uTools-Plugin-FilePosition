var fs = require("fs");
var path = require('path');
var exec = require('child_process').exec;

function addRoot(callbackSetList) {
    itemes = [];
    if (utools.isWindows()) {
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
    } else {
        var StartTime = new Date().getTime();
        fs.readdir("/", function (err, files) {
            if (!err) {
                files.forEach(function (filename) {
                    var filedir = path.join("/", filename);
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
        while ((new Date().getTime() < StartTime + 100) && (itemes.length < 2));
        fs.readdir("/", function (err, files) {
            if (!err) {
                files.forEach(function (filename) {
                    var filedir = path.join("/", filename);
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
    }
    console.log("add: /");
    callbackSetList(itemes);
}

function existDir(dirPathName) {
    try {
        var stat = fs.statSync(dirPathName);
        if (stat.isDirectory()) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

function existFile(dirPathName) {
    try {
        var stat = fs.statSync(dirPathName);
        if (stat.isFile()) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

function existFileOrDir(dirPathName) {
    try {
        var stat = fs.statSync(dirPathName);
        if (stat.isFile()) {
            return true;
        } else if (stat.isDirectory()) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
}

function getStat(dirPathName) {
    try {
        var stat = fs.statSync(dirPathName);
        if (stat) {
            return stat;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

function getExistPath(dirPathName) {
    if (!dirPathName) {
        return "";
    }
    if (utools.isWindows()) {
        if (dirPathName.length < 2) {
            return "";
        } else {
            if (existFileOrDir(dirPathName)) {
                return dirPathName;
            } else {
                var tempStr = dirPathName;
                if (tempStr.charAt(tempStr.length - 1) == "/" || tempStr.charAt(tempStr.length - 1) == "\\") {
                    tempStr = tempStr.substring(0, tempStr.length - 1);
                }
                var lastIndex = tempStr.lastIndexOf("\\");
                if (lastIndex >= 1) {
                    tempStr = tempStr.substring(0, lastIndex);
                    return getExistPath(tempStr);
                } else {
                    return "";
                }
            }
        }
    } else {
        if (existFileOrDir(dirPathName)) {
            return dirPathName;
        } else {
            var tempStr = dirPathName;
            if (tempStr == "/") {
                return tempStr;
            }
            if (tempStr == "\\") {
                return "/";
            }
            if ((tempStr.charAt(tempStr.length - 1) == "/" || tempStr.charAt(tempStr.length - 1) == "\\") && (tempStr.length > 1)) {
                tempStr = tempStr.substring(0, tempStr.length - 1);
            }
            var lastIndex = tempStr.lastIndexOf("/");
            if (lastIndex >= 1) {
                tempStr = tempStr.substring(0, lastIndex);
                return getExistPath(tempStr);
            } else {
                return "";
            }
        }
    }
    return "";
}

window.exports = {
    "go": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "list",  // 列表模式
        args: {
            // 进入插件时调用（可选）
            enter: (action, callbackSetList) => {
                if (action.type == "regex") {
                    console.log(action.type + " : " + action.payload);
                    var findWord = action.payload;

                    var pett = /^"?'?\/(.+\/?)+'?"?$/;
                    if (utools.isWindows()) {
                        pett = /^"?[C-Zc-z]:[^:*?"<>|\f\n\r\t\v]*"?$/;
                    }
                    if (pett.test(findWord)) {
                        if ((findWord.charAt(0) == "\"") || (findWord.charAt(0) == "\'")) {
                            findWord = findWord.replace(/\"/g, "");
                            findWord = findWord.replace(/\'/g, "");
                        }
                        var existPath = getExistPath(findWord);
                        console.log("Exist Path:" + existPath);
                        if (existPath.length > 0) {
                            fs.stat(existPath, function (err, stat) {
                                if (err) {
                                    addRoot(callbackSetList);
                                } else {
                                    if (stat.isFile()) {
                                        console.log("File: " + existPath);
                                        window.utools.setSubInputValue(existPath);
                                    } else if (stat.isDirectory()) {
                                        console.log("Dir: " + existPath);
                                        if (existPath.charAt(existPath.length - 1) == "/" || existPath.charAt(existPath.length - 1) == "\\") {
                                            window.utools.setSubInputValue(existPath);
                                        } else {
                                            if (utools.isWindows()) {
                                                window.utools.setSubInputValue(existPath + "\\");
                                            } else {
                                                window.utools.setSubInputValue(existPath + "/");
                                            }
                                        }
                                    } else {
                                        console.log("No File or No Dir");
                                        addRoot(callbackSetList);
                                    }
                                }
                            });
                        } else {
                            console.log("Not Find");
                            addRoot(callbackSetList);
                        }
                    } else {
                        console.log("正则不匹配");
                        addRoot(callbackSetList);
                    }
                } else {
                    // no regex
                    addRoot(callbackSetList);
                }
            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                // 获取一些数据
                // 执行 callbackSetList 显示出来
                var pett = /^"?'?\/(.+\/?)+'?"?$/;
                if (utools.isWindows()) {
                    pett = /^"?[C-Zc-z]:[^:*?"<>|\f\n\r\t\v]*"?$/;
                }
                if (!pett.test(searchWord)) {
                    addRoot(callbackSetList);
                    return;
                }

                var findWord = searchWord;
                if (utools.isWindows()) {
                    var pett2 = /^"?[C-Zc-z]:$/;
                    if (pett2.test(findWord)) {
                        findWord = findWord + "\\";
                    }
                } else {
                    if (findWord.length == 0) {
                        findWord = "/";
                    }
                    if (findWord == "\\") {
                        findWord = "/";
                    }
                }
                fs.stat(findWord, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        console.log('文件夹存在');
                        var itemes = [];
                        //先把文件夹本身放到第一条
                        var des = "";
                        if (utools.isWindows()) {
                            des = "在资源管理器中打开";
                        } else if (utools.isMacOs()) {
                            des = "在Finder中打开";
                        } else {
                            des = "在文件管理器中打开";
                        }
                        var f = {
                            title: findWord,
                            description: des,
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
                        while ((new Date().getTime() < StartTime + 100) && (itemes.length < 2));
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
                        var des = "";
                        if (utools.isWindows()) {
                            des = "在资源管理器中定位此文件";
                        } else if (utools.isMacOs()) {
                            des = "在Finder中定位此文件";
                        } else {
                            des = "在文件管理器中定位此文件";
                        }
                        var f = {
                            title: findWord,
                            description: des,
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
                        var parentPath;
                        var keyWord;
                        if (utools.isWindows()) {
                            index = findWord.lastIndexOf("\\");
                            if ((index <= 0) || (index >= findWord.length - 1)) return;
                            parentPath = findWord.substring(0, index + 1);
                            keyWord = findWord.substring(index + 1, findWord.length);
                            if (keyWord.length <= 0) return;
                            var pett2 = /^"?[C-Zc-z]:$/;
                            if (pett2.test(parentPath)) {
                                parentPath = parentPath + "\\";
                            }
                        } else {
                            index = findWord.lastIndexOf("/");
                            if (index < 0) return;
                            parentPath = findWord.substring(0, index + 1);
                            keyWord = findWord.substring(index + 1, findWord.length);
                            if (parentPath.length == 0) {
                                parentPath = "/";
                            }
                            if (parentPath == "\\") {
                                parentPath = "/";
                            }
                        }

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
                                    while ((new Date().getTime() < StartTime + 100) && (itemes.length < 2));
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
                    window.utools.shellOpenItem(url);
                    window.utools.outPlugin();
                } else {
                    if (utools.isWindows()) {
                        window.utools.setSubInputValue(itemData.url + "\\");
                    } else {
                        window.utools.setSubInputValue(itemData.url + "/");
                    }
                }
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索"
        }
    }
}