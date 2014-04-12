
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


app.get('/projects', function(req, res) {
    mongoDBService.getProjects()
    .then(function(projects) {
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(projects));
    });
});

app.get('/project/:id', function(req, res) {
    
});

app.get('/crop', function(req, res) {
    var tileWidth = 150;
    var tileHeight = 100;
    bsService.get("togedle", "disneyland.jpg", "/tmp/output.jpg")
    .then(function(image) {
        return new Promise(function(resolve, reject) {
            gm(image).command('convert').in("-crop", tileWidth + "x" + tileHeight).in('+adjoin').in(image).write('outputs/disney%04d.jpg', function(err){
                if (err) {
                    reject(err);
                }
                resolve("outputs/");
            })
        });
    })
    .then(function(folder){
        // upload to azure
        bsService.putFolder("togedle", folder)
        .then(function(result){
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({"done" : "done"}));
        });
    });
});

app.get('/store', function(req, res) {
    bsService.put("togedle", "disneyland.jpg", "disneyland.jpg")
    .then(function(image) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({"done" : "done"}));
    });
});


http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
