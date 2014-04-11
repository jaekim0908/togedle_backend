var Promise = require("bluebird");
//diff calculation
//Returns a set of elements that are in awsList and not in azureList.
//checks the name
//should check md5 and maybe edit date.
exports.diff = function(listA, listB) {
    var diffList = [];
    for (var filename in listA){
        if(filename in listB) {
            console.log("already has " + filename);
        } else {
            console.log("dont have " + filename);
            diffList.push(filename);
        }
    }
    return diffList;
} 

exports.promiseWhile = function(condition, action) {
    var resolver = Promise.defer();
    var loop = function() {
        if (condition()) return resolver.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };
 
    process.nextTick(loop);
    return resolver.promise;
};