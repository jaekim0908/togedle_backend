var mongodb = require('mongodb');
var db = require("mongojs").connect("mongodb://localhost:27017/togedle", ["projects"]);
var Promise = require("bluebird");
var ObjectId = require('mongodb').ObjectID;

//db.configurations.insert({"username" : "gombbin", "primary" : {"serviceProvider" : "aws", "name" : "talkingbinsample", "multiplier" : 0}, "secondary" : {"serviceProvider" : "azure", "name" : "talkingbinsample", "multiplier" : 0}});

var numbers = [];
for (var i = 0; i < 264; i++){
    
    numbers.push(i);
}
db.projects.update({_id: new mongodb.ObjectID("53491643622c6abd56cc6068")}, {$set: {"tiles" : numbers, "imagePrefix" : "disney", "done" : [ ], "width" : 11, "height" : 24, "inProgress" : [ ], "name" : "disney", "original" : "disneyland.jpg", "originalUrl" : "http://portalvhds3p9kt60f97ngh.blob.core.windows.net/togedle/disneyland.jpg", "tileHeight" : 100, "tileWidth" : 150}});

//db.projects.insert({"name" : "disney", "width" : 11, "height" : 24, "done" : [], "inProgress" : []});
/*
exports.findConfigurationByUser = function(username){
    return new Promise(function(resolve, reject) {
        db.configurations.findOne({"username" : username}, function(err, configuration){
            if(err || !configuration) {
                console.log("error finding configuration for user : " + username);
                reject(err);
            } else {
                resolve(configuration);
            }
        });
    });
}*/

exports.getTileNumber = function(id) {
    return new Promise(function(resolve, reject) {
        db.projects.findOne(
            {_id : new mongodb.ObjectID(id)},
            function(err, result){
                if(err || !result) {
                    console.log("error finding projects");
                    reject(err);
                } else {
                    resolve(result.tiles);
                }
            }
        );
    });
}

exports.getPushTileNumber = function(id, tileNumber) {
    return new Promise(function(resolve, reject) {
        db.projects.update({_id : new mongodb.ObjectID(id)}, { $push: {"inProgress" : tileNumber}}, function(err, result){
            if(err || !result) {
                console.log("error finding projects");
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

exports.update = function(id, content) {
    return new Promise(function(resolve, reject) {
        db.projects.update({_id : new mongodb.ObjectID(id)}, { $set: content }, function(err, result){
            if(err || !result) {
                console.log("error finding projects");
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

exports.getProjects = function(){
    return new Promise(function(resolve, reject) {
        db.projects.find({}, function(err, result){
            if(err || !result) {
                console.log("error finding projects");
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

exports.getProject = function(id){
    return new Promise(function(resolve, reject) {
        db.projects.findOne({_id : new mongodb.ObjectID(id)}, function(err, result){
            if(err || !result) {
                console.log("error finding projects");
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

