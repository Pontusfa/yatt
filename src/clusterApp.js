/**
 * Main entry point to create and run the tracker web app as multi core clusters.
 * Good for production use with high payload running on a non-low end system.
 * Initiates the app and kicks back, letting the others do the heavy lifting.
 */
var cluster = require('cluster');

if (cluster.isMaster) {
    var cpuCount = require('os').cpus().length;

    // Create a worker for each CPU
    for (var i = 0; i < cpuCount; i += 1) {
        cluster.fork();
    }
}
else {
    var app = require('./lib/init');
    // Let the show begin.
    app();
}

