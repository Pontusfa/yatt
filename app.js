/**
 * Main entry point to create and run the tracker web app as a single process.
 * Good for development/low memory footprint/light traffic.
 * Initiates the app and kicks back, letting the others do the heavy lifting.
 * @author Pontus Falk
 */
var app = require('./lib/init');
// Let the show begin.
app();

