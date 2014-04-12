var mongodb = require('mongodb');
var mongojs = require('mongojs');
var db = require("mongojs").connect("mongodb://localhost:27017/togedle", ["projects"]);
var Promise = require("bluebird");
var ObjectId = require('mongodb').ObjectID;

//db.configurations.insert({"username" : "gombbin", "primary" : {"serviceProvider" : "aws", "name" : "talkingbinsample", "multiplier" : 0}, "secondary" : {"serviceProvider" : "azure", "name" : "talkingbinsample", "multiplier" : 0}});
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

