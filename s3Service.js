var AWS = require('aws-sdk');
var Promise = require("bluebird");
var s3 = new AWS.S3();

// Get filenames from S3 bucket
exports.getFilenamesFromS3 = function(bucketName){
    return new Promise(function(resolve, reject){
        s3.listObjects({ Bucket: bucketName }, function(err, data) {
            if (err) {
                reject(err);
            }
            var fileList = {};
            for (var i in data.Contents) {
                fileList[data.Contents[i].Key] = data.Contents[i];
            }
            resolve(fileList);
        });
    });
}

exports.getAWSReadStream = function(file, fromBin){
    var filename = file;
    var params = {Bucket: fromBin.name, Key: filename};
    
    return stream = s3.getObject(params).createReadStream();
}

exports.getImage = function(fromBin, file){
    var filename = file;
    var params = {Bucket: fromBin, Key: filename};
    
    return new Promise(function(resolve, reject) {
        s3.getObject(params, function(err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

exports.getBucketPolicy = function(bucketName){
    return new Promise(function(resolve, reject){
        s3.getBucketPolicy({ Bucket: bucketName }, function(err, data) {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}