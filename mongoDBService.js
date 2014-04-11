var MongoClient = require('mongodb').MongoClient;
var mongojs = require('mongojs');
var db = require("mongojs").connect("mongodb://localhost:27017/talkingBin", ["bins", "configurations"]);
var Promise = require("bluebird");
var ObjectId = require('mongodb').ObjectID;

//db.configurations.insert({"username" : "gombbin", "primary" : {"serviceProvider" : "aws", "name" : "talkingbinsample", "multiplier" : 0}, "secondary" : {"serviceProvider" : "azure", "name" : "talkingbinsample", "multiplier" : 0}});

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
}


