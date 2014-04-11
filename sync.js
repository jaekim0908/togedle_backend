// Global modules
var AWS = require('aws-sdk');
var azure = require('azure');
var Promise = require("bluebird");
//var argv = require('minimist')(process.argv.slice(2));

// Custom modules
//var parseService = require('./parseService');
var util = require('./util');
var s3Service = require('./s3Service');
var bsService = require('./bsService');

// Property
var awsFileList = {};
var azureFileList = {};
AWS.config.region = 'us-west-2';
var s3 = new AWS.S3();
var blobService = azure.createBlobService();

var primaryBin;
var secondaryBin;

/*
 * Terminology
 * Bin : A bin is a collection of files used in cloud services. In S3, it is called "bucket", and in Azure, it is called "container".
 * Primary bin : The bin that acts as the authoritative source of files, and the one that's used primarily in production. When the primary bin is unavailable for any reason, disaster recovery starts and one of the secondary bins is used in place of the primary bin.
 * Secondary bins : Bins that contains the same content as the primary bin but used only in disaster recovery.
 * Multiplier : A multiplier number is the number of BS containers necessary to store the data in a single S3 bucket. This is necessary because there is a storage limit on BS container and S3 bucket does not have a limit.
 */

/* 
 * Sync
 * 
 * sync.js takes a username. It then retrieves the primary and secondary bins then performs sync.
 * 
 * Sync.js runs in the following order.
 * 1. Retrieve primary and secondary bin information.
 * 1. Get the list of files in the primary bin.
 * 2. Get the list of files in a secondary bin.
 * 3. Calculate the diff between the list.
 * 4. Copy or delete files in the secondary bin.
 * 5. Repeat 2-4 for all secondary bins.
 * 
 * Note:
 * Sync should run on a certain interval of time. 1hr/6hr etc
 * Once Disaster Mode kicks in, stop all sync activities.
 * If the script is required to "delete" more than certain percentage of the data, it should not run and emit a warning requiring manual approval..
 */

//get username
/*
var username = argv.u;

if (username == null) {
    console.log("Usage : node sync.js -u (username)");
    return;
}
console.log("username : " + username)
*/
// get primary and secondary information
/*
parseService.getConfigurationByUsername(username)
.then(function(configuration){
    primary = configuration.get("primary").toJSON();
    secondary = configuration.get("secondary").toJSON();
    
    var promises = [];
    // get file list
    promises.push((primary.provider == "aws") ? s3Service.getFilenamesFromS3(primary.name) : bsService.getFilenamesFromBlob(primary.name));
    promises.push((secondary.provider == "aws") ? s3Service.getFilenamesFromS3(secondary.name) : bsService.getFilenamesFromBlob(secondary.name));
    
    return Promise.all(promises);
})*/
exports.syncByUsername = function(results, maximumThread, configuration) {
    var primary = configuration.primary;
    var secondary = configuration.secondary;
    primary.fileList = results[0];
    secondary.fileList = results[1];
    
    // get diff
    // TODO : taskQueue needs to be more generic, including copy from azure to aws operation and delete operation.
    var copyTasks = util.diff(primary.fileList, secondary.fileList);
    var deleteTasks = util.diff(secondary.fileList, primary.fileList);
    console.log("Copy task list: " + copyTasks);
    console.log("Delete task list: " + deleteTasks);
    
    var promises = [];
    for (var i = 0; i < maximumThread; i++){
        promises.push(util.promiseWhile(function() {return copyTasks.length <= 0;}, function(){return copyFromAWSToAzure(copyTasks.pop(), primary, secondary);}));
    }
    for (var i = 0; i < maximumThread; i++){
        promises.push(util.promiseWhile(function() {return deleteTasks.length <= 0;}, function(){return bsService.deleteFromAzure(deleteTasks.pop(), secondary);}));
    }
    return Promise.all(promises);
}

var copyFromAWSToAzure = function(filename, fromBin, toBin) {
    var readStream = s3Service.getAWSReadStream(filename, fromBin);
    return bsService.writeToAzureFromStream(filename, toBin, readStream, fromBin.fileList[filename].Size);
}
