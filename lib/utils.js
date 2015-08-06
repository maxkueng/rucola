var path = require('path');
var fs = require('fs');
var ini = require('ini');
var stripJsonComments = require('strip-json-comments');
var nest = require('flatnest').nest;

var parse = exports.parse = function (content) {
  try {
    return JSON.parse(stripJsonComments(content));
  } catch (ex) {
    return ini.parse(content);
  }
};

var file = exports.file = function (filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (ex) {
    return null;
  }
};

var find = exports.find = function () {
  var rel = path.join.apply(null, [].slice.call(arguments))

  function find (start, rel) {
    var filePath = path.join(start, rel);

    if (fs.existsSync(filePath)) {
      return filePath;
    }

    if (path.dirname(start) !== start) {
      return find(path.dirname(start), rel);
    }
  }

  return find(process.cwd(), rel);
};

var env = exports.env = function (prefix) {
  prefix = prefix.toUpperCase().replace(/[^A-Z0-9]+/, '_');

  var obj = {};
  var env = process.env;

  var vars = Object.keys(env)
    .reduce(function find(vars, name) {
      if (name.indexOf(prefix) === 0) {
        vars[name.substring(prefix.length).replace(/[_]+/, '.').toLowerCase()] = env[name];
      }
      return vars;
    }, {});

  return nest(vars);
};

var argv = exports.argv = function (argv) {
  var vars = Object.keys(argv)
    .reduce(function (vars, name) {
      if (name === '_') {
        vars[name] = argv[name];
      } else {
        vars[name.toLowerCase().replace(/[^a-z0-9]+/, '.')] = argv[name];
      }
      return vars;
    }, {});

  vars = nest(vars);

  return vars;
};
