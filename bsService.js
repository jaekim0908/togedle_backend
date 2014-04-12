var azure = require('azure');
var Promise = require("bluebird");
var fs = require("fs");
var util = require("./util");
var blobService = azure.createBlobService();

exports.put = function(container, filename, fileLocation, options, retry) {
    // fileLocation is the folder
    var fileLocation = (fileLocation == null) ? "" : fileLocation;
    return new Promise(function(resolve, reject) {
        blobService.createBlockBlobFromFile(
                container,
                "tile/" + filename,
                fileLocation + filename,
                options,
                function(error, blobResult, response){
                    if(!error){
                        console.log("- stored " + filename);
                        resolve(filename);
                    } else {
                        console.log("error " + error);
                        // dangerous!! possible infinite loop
                        retry(filename);
                        resolve(error);
                    }
                });
    });
    
}

exports.putFolder = function(container, folderLocation, maxThreads, options) {
    var promises = [];
    var files = fs.readdirSync(folderLocation);
    for (var i = 0; i < maxThreads; i++){
        promises.push(util.promiseWhile(
                //termination condition
                function() { return files.length <= 0;},
                //run this until
                function() { return exports.put(container, files.pop(), folderLocation, options, function(file) { files.push(file); })}
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

exports.deleteBlob = function(container, filename) {
    return new Promise(function(resolve, reject){
        blobService.deleteBlob(container, filename, function(error, result){
            if(!error){
                console.log(filename + " deleted");
                resolve(result);
            } else {
                reject(error);
            }
        });
    });
}

exports.deleteBlobMulti = function(container, blobs, maximumThread) {
    var promises = [];
    for (var i = 0; i < maximumThread; i++){
        promises.push(util.promiseWhile(
                //termination condition
                function() { return blobs.length <= 0;},
                //run this until
                function() { return exports.deleteBlob(container, blobs.pop().name); }
        ));
    }
    return Promise.all(promises);
}



exports.list = function(container, options){
    return new Promise(function(resolve, reject){
        blobService.listBlobs(container, options, function(error, result){
            if(!error){
                resolve(result);
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