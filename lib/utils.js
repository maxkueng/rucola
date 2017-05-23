const path = require('path');
const fs = require('fs');
const ini = require('ini');
const yaml = require('yaml-js');
const stripJsonComments = require('strip-json-comments');
const nest = require('flatnest').nest;
const flatten = require('flatnest').flatten;

const parse = exports.parse = function (content) {
  try {
    return normalize(JSON.parse(stripJsonComments(content)));
  } catch (ex) {
    try {
      const yamlValue = yaml.load(content);

      if (typeof yamlValue === 'string') {
        throw new Error('Accidentally parsed ini as yaml :/');
      }

      return normalize(yamlValue);
    } catch (ex) {
      return normalize(ini.parse(content));
    }
  }
};

const file = exports.file = function (filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (ex) {
    return null;
  }
};

const find = exports.find = function () {
  const rel = path.join.apply(null, [].slice.call(arguments));

  function find(start, rel) {
    const filePath = path.join(start, rel);

    if (fs.existsSync(filePath)) {
      return filePath;
    }

    if (path.dirname(start) !== start) {
      return find(path.dirname(start), rel);
    }
  }

  return find(process.cwd(), rel);
};

const keysToLowerCase = exports.keysToLowerCase = function (obj) {
  const keys = Object.keys(obj);
  const newObj = {};

  let key;
  let i = keys.length;
  while (i--) {
    key = keys[i];
    newObj[key.toLowerCase()] = obj[key];
  }

  return newObj;
};

const conditionalTransformKeys = exports.conditionalTransformKeys = function (obj, condition, transform) {
  const keys = Object.keys(obj);
  const newObj = {};

  let key,
    value;
  let i = keys.length;
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

const env = exports.env = function (prefix, env) {
  prefix = prefix.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  env = env || process.env;

  function isAppVar(key) {
    return key.indexOf(prefix) === 0;
  }

  function transformKey(key) {
    return key.substring(prefix.length).replace(/[_]+/g, '.');
  }

  const vars = conditionalTransformKeys(env, isAppVar, transformKey);

  return normalize(vars);
};

const argv = exports.argv = function (argv) {
  // preserve argv._
  const __ = argv._;

  function canTransform(key) {
    return key !== '_';
  }

  function transformKey(key) {
    return key.replace(/[^a-z0-9]+/gi, '.');
  }

  const vars = conditionalTransformKeys(argv, canTransform, transformKey);
  vars._ = __;

  return normalize(vars);
};
