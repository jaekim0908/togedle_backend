var azure = require('azure');
var Promise = require("bluebird");
var fs = require("fs");
var util = require("./util");
var blobService = azure.createBlobService();

exports.put = function(container, filename, fileLocation) {
    // fileLocation is the folder
    var fileLocation = (fileLocation == null) ? "" : fileLocation;
    return new Promise(function(resolve, reject) {
        blobService.createBlockBlobFromFile(
                container,
                filename,
                fileLocation + filename,
                function(error, blobResult, response){
                    if(!error){
                        console.log("- stored " + filename);
                        resolve(filename);
                    } else {
                        // TODO : Do not stop everything because we failed to copy one file.
                        console.log("error");
                        reject(error);
                    }
                });
    });
    
}

exports.putFolder = function(container, folderLocation) {
    var promises = [];
    var maximumThread = 5;
    var files = fs.readdirSync(folderLocation);
    for (var i = 0; i < maximumThread; i++){
        promises.push(util.promiseWhile(
                //termination condition
                function() { return files.length <= 0;},
                //run this until
                function() { return exports.put(container, files.pop(), folderLocation)}
        ));
    }
    return Promise.all(promises);
    
}


exports.get = function(container, filename, output) {
    return new Promise(function(resolve, reject) {
        var fs=require('fs');
        blobService.getBlobToFile(
                container,
                filename,
                output,
                function(error, blobResult, response){
                    if(!error){
                        console.log("- stored " + filename);
                        resolve(output);
                    } else {
                        // TODO : Do not stop everything because we failed to copy one file.
                        reject(error);
                    }
                });
    });
    
}


//Get filenames from blob storage
exports.getFilenamesFromBlob = function(containerName){
    return new Promise(function(resolve, reject){
        blobService.listBlobs(containerName, function(error, blobs){
            if(!error){
                var fileList = {};
                for(var i in blobs){
                    fileList[blobs[i].name] = blobs[i];
                }
                resolve(fileList);
            } else {
                reject(error);
            }
        });
    });
}

exports.writeToAzureFromStream = function(filename, toBin, readStream, size) {
    return new Promise(function(resolve, reject) {
        var options = {};
        blobService.createBlockBlobFromStream(
                toBin.name,
                filename,
                readStream,
                size,
                options,
                function(error, blobResult, response){
                    if(!error){
                        console.log("- copied " + filename);
                        resolve(filename);
                    } else {
                        // TODO : Do not stop everything because we failed to copy one file.
                        reject(error);
                    }
                });
    });
}

exports.getContainerACL = function(containerName) {
    return new Promise(function(resolve, reject){
        blobService.getContainerAcl(containerName, function(error, acl){
            if(!error){
                resolve(acl);
            } else {
                reject(errpr);
            }
        });
    });
}

exports.deleteFromAzure = function(filename, bin) {
    return new Promise(function(resolve, reject){
        blobService.deleteBlob(
                bin.name,
                filename,
                function(error){
                    if(!error){
                        console.log("- deleted " + filename);
                        resolve(filename);
                    } else {
                        reject(error);
                    }
                });
    });
}