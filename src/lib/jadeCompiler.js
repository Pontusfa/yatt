/**
 * Depending on if we're in production or development mode, we want to be able
 * to either replace jade templates on the fly(easier to see changes, slower)
 * or compile them(need to restart app to see changes, quicker)
 * jadeCompiler is a function that does one of the two.
 */

var jade = require('jade');

/**
 * Supplies each controller with a way to  compile jade into html.
 */
function _justInTimeCompile(app, pagePath) {
    return function (templateName) {
        var fullPath = process.cwd() +
            '/' + app.config.setters.pages + '/' + pagePath + '/' +
            templateName + '.jade';

        return function (locals) {
            var newLocals = {pretty: app.settings.pretty, dev: true, basedir: process.cwd()};

            locals = locals || {};

            Object.keys(locals).forEach(function (key) {
                if (locals.hasOwnProperty(key)) {
                    newLocals[key] = locals[key];
                }
            });

            return jade.renderFile(fullPath, newLocals);
        };

    };
}

/**
 * @private
 */
function _preCompiled(app, pagePath) {
    var fs = require('fs'),
        partialPath = process.cwd() + '/' +
            'src/' + 'pages/' + pagePath + '/';
    return function (templateName) {
        var fullPath = partialPath + templateName + '.jade',
            template = fs.readFileSync(fullPath),
            compiledJade = jade.compile(template, {basedir: process.cwd()});

        return function (locals) {
            var newLocals = {pretty: app.settings.pretty, basedir: process.cwd()};
            locals = locals || {};
            Object.keys(locals).forEach(function (key) {
                if (locals.hasOwnProperty(key)) {
                    newLocals[key] = locals[key];
                }
            });
            return compiledJade(newLocals);
        };
    };
}

module.exports = function (env) {
    if (env === 'development') {
        module.exports = _justInTimeCompile;
    }
    else {
        module.exports = _preCompiled;
    }
    return module.exports;
};
