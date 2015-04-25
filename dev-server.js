var express = require('express');
var morgan = require('morgan');
var fs = require('fs');
var async = require('async');
var compression = require('compression');
//var devUtils = require('./utils');

var app = express();
app.use(morgan('combined'));
app.use(compression());

// var httpProxy = require("http-proxy");
// var proxy = new httpProxy.createProxyServer();

/**
 * given a path, asynchronously read and find all directories contained within
 *
 * @param path - path to read
 * @param callback - function(err, arrayOfDirectories)
 */
var getDirs = function(path, callback) {
    // read parent directory
    fs.readdir(path, function(err, fileNames) {
        if(err) return callback(err);
        console.log("fileNames", fileNames);
        // get fs.stat for each file/directory
        async.map(fileNames, function(fileName, mapCallback) {
            // get fs.stat for an individual file/directory, return it as an object
            // containing the path to the file and the fs.stat object
            var pathFileName = path + "/" + fileName;
            console.log("statting", pathFileName);
            fs.stat(pathFileName, function(err, stat) {
                mapCallback(err, {fileName: pathFileName, stat: stat});
            });
        }, function(err, fileStats) {
            // once we have fs.stat for each file...
            if(err) return callback(err);
            // filter so we only keep directories
            callback(null, fileStats.filter(function(fileStat) {
                return fileStat.stat.isDirectory();
            // return only the path to the file
            }).map(function(fileStat) {
                return fileStat.fileName;
            }));
        });
    });
};


/*var getModules = function(rootDirectory, moduleFileName, callback) {
    console.log("root directory", rootDirectory);
};*/

var getModules = function(dirs, moduleFileName, callback) {
    async.filter(dirs, function(path, mapCallback) {
        // @TODO don't repeat filename
        var moduleFile = path + "/" + moduleFileName;
        console.log("checking", moduleFile);
        fs.exists(moduleFile, function(exists) {
            console.log("   ", moduleFile, exists);
            mapCallback(exists);
        });
    }, function(result) {
        callback(null, result);
    });
};

// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });
module.exports = function(conf) {
    conf.static = conf.static || "/static";
    conf.api = conf.api || "/api";
    conf.port = conf.port || process.env.port || 8080;
    conf.address = conf.address || process.env.address || "127.0.0.1";
    conf.moduleFileName = "dev-server-module.js";
    var gmCallback = function(dirs) {
        getModules(dirs, conf.moduleFileName, function(err, moduleList) {
            console.log("moduleList", moduleList);
            moduleList.map(function(modulePath) {
                var moduleFile = modulePath + "/" + conf.moduleFileName;
                console.log("loading module", moduleFile);
                // try {
                    var module = require(moduleFile);
                    module.load(app, conf);
                // } catch(e) {
                //     console.error("Unable to load ", moduleFile, e);
                //     throw e;
                // }
            });
            var server = app.listen(conf.port, conf.address, function () {
              var host = server.address().address;
              var port = server.address().port;

              console.log('dev-server listening at http://%s:%s', host, port);
            });
        });

    };

    if(Array.isArray(conf.projects)) {
        gmCallback(conf.projects);
    } else {
        getDirs(rootDirectory, function(err, dirs) {
            if(err) return callback(err);
            gmCallback(dirs);
        });
    }
};
