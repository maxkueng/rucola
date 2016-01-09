var path = require('path');
var fs = require('fs');
var ini = require('ini');
var yaml = require('yaml-js');
var stripJsonComments = require('strip-json-comments');
var nest = require('flatnest').nest;
var flatten = require('flatnest').flatten;

var parse = exports.parse = function (content) {
  try {
    return normalize(JSON.parse(stripJsonComments(content)));

  } catch (ex) {
    try {
      var yamlValue = yaml.load(content);

      if (typeof yamlValue === 'string') {
        throw new Error('Accidentally parsed ini as yaml :/');
      }

      return normalize(yamlValue);

    } catch (ex) {
      return normalize(ini.parse(content));
    }
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

var keysToLowerCase = exports.keysToLowerCase = function (obj) {
  var keys = Object.keys(obj);
  var newObj = {}

  var key;
  var i = keys.length;
  while (i--) {
    key = keys[i];
    newObj[key.toLowerCase()] = obj[key];
  }

  return newObj;
};

var conditionalTransformKeys = exports.conditionalTransformKeys = function (obj, condition, transform) {
  var keys = Object.keys(obj);
  var newObj = {}

  var key, value;
  var i = keys.length;
  while (i--) {
    key = keys[i];
    value = obj[key];

    if (condition === true || condition(key, value)) {
      newObj[transform(key, value)] = value;
    }
  }

  return newObj;
};

var normalize = exports.normalize = function (obj) {
  return nest(keysToLowerCase(flatten(obj || {})));
};

var env = exports.env = function (prefix, env) {
  prefix = prefix.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  env = env || process.env;

  function isAppVar (key) {
    return key.indexOf(prefix) === 0;
  }

  function transformKey (key) {
    return key.substring(prefix.length).replace(/[_]+/g, '.');
  }

  var vars = conditionalTransformKeys(env, isAppVar, transformKey);

  return normalize(vars);
};

var argv = exports.argv = function (argv) {
  // preserve argv._
  var __ = argv._;

  function canTransform (key) {
    return key !== '_';
  }

  function transformKey (key) {
    return key.replace(/[^a-z0-9]+/gi, '.');
  }

  var vars = conditionalTransformKeys(argv, canTransform, transformKey);
  vars._ = __;

  return normalize(vars);
};
