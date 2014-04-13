
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

app.get('/projects', function(req, res) {
    mongoDBService.getProjects()
    .then(function(projects) {
       res.setHeader("Access-Control-Allow-Origin", "http://localhost:8888");        
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(projects));
    });
});

app.get('/project/:id', function(req, res) {
    mongoDBService.getProject(req.params.id)
    .then(function(project) {
       res.setHeader("Access-Control-Allow-Origin", "http://localhost:8888");        
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(project));
    });
});

app.get('/randomTile/:id', function(req, res) {
    var tileNum;
    mongoDBService.getTileNumber(req.params.id)
    .then(function(tile) {
        tileNum = tile.pop();
        return mongoDBService.update(req.params.id, {"tiles" : tile});
    })
    .then(function() {
        return mongoDBService.getPushTileNumber(req.params.id, tileNum);
    })
    .then(function() {
       res.setHeader("Access-Control-Allow-Origin", "http://localhost:8888");        
       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify({"tile" : tileNum}));
    });
});

app.get('/list/:prefix', function(req, res) {
    bsService.list("togedle", {"prefix": req.params.prefix})
    .then(function(files) {
        console.log(files.length);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({"files" : files}));
    })
});

app.get('/delete', function(req, res) {
    bsService.list("togedle", {"prefix": "disney0"})
    .then(function(images) {
        return bsService.deleteBlobMulti("togedle", images, 5);
    })
    .then(function() {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({"status" : "success"}));
    });
});

app.get('/crop/:id', function(req, res) {
    var id = req.params.id;
    var project;
    console.log("splitting for project " + id);
    mongoDBService.getProject(id)
    .then(function(proj) {
        console.log(proj);
        project = proj;
        return bsService.get("togedle", project.original, "/tmp/" + project.original);
    })
    .then(function(image) {
        return new Promise(function(resolve, reject) {
            gm(image).command('convert').in("-crop", project.tileWidth + "x" + project.tileHeight).in('+adjoin').in(image).write("outputs/" + project.name + "%04d.jpg", function(err){
                if (err) {
                    reject(err);
                }
                resolve("outputs/");
            })
        });
    })
    .then(function(folder){
        console.log("split success");
        // upload to azure
        bsService.putFolder("togedle", folder, 3, {"blockIdPrefix" : "tile"})
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
