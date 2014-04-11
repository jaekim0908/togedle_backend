
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var Promise = require("bluebird");
var gm = require("gm");

var mongoDBService = require('./mongoDBService');
var s3Service = require('./s3Service');
var bsService = require('./bsService');
var sync = require('./sync');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join('views'));
app.engine('html', require('ejs').renderFile);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    res.render('index.html');
});

app.get('/getAccountInfo/:username', function(req, res) {
    console.log("request in for username : " + req.param('username'));
    var username = req.params.username;
    var configuration;
    mongoDBService.findConfigurationByUser(username)
    .then(function(conf) {
        var promises = [];
        configuration = conf;
        promises.push(s3Service.getFilenamesFromS3(conf.primary.name));
        promises.push(bsService.getFilenamesFromBlob(conf.secondary.name));
        return Promise.all(promises);
    })
    .then(function(files){
        configuration.primary.files = files[0];
        configuration.secondary.files = files[1];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({"configuration" : configuration}));
    })
    .catch(function(error){
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({"error" : error}));
    });
});

app.get('/getBucketPolicy/:bucketName', function(req, res) {
    console.log("request in for bucket : " + req.param('bucketName'));
    var bucket = req.params.bucketName;
    s3Service.getBucketPolicy(bucket)
    .then(function(policy){
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({"policy" : policy}));
    });
});

app.get('/getContainerACL/:containerName', function(req, res) {
    console.log("request in for container : " + req.param('containerName'));
    var containerName = req.params.containerName;
    bsService.getContainerACL(containerName)
    .then(function(acl){
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({"acl" : acl}));
    });
});

app.get('/crop', function(req, res) {
    s3Service.getImage("talkingbinsample", "disneyland.jpg")
    .then(function(image) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({"done" : "done"}));
    });
});



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
