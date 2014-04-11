var azure = require('azure');
var Promise = require("bluebird");
var blobService = azure.createBlobService();

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