import path from 'path';
import fs from 'fs';
import * as ini from 'ini';
import * as yaml from 'yaml-js';
import stripJsonComments from 'strip-json-comments';
import { nest, flatten } from 'flatnest';

export function keysToLowerCase(obj) {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    newObj[key.toLowerCase()] = obj[key];
  });
  return newObj;
}

export function normalize(obj = {}) {
  return nest(keysToLowerCase(flatten(obj)));
}

export function parse(content) {
  try {
    return normalize(JSON.parse(stripJsonComments(content)));
  } catch (normalizeErr) {
    try {
      const yamlValue = yaml.load(content);

      if (typeof yamlValue === 'string') {
        throw new Error('Accidentally parsed ini as yaml :/');
      }

      return normalize(yamlValue);
    } catch (yamlErr) {
      return normalize(ini.parse(content));
    }
  }
}

export function file(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    return null;
  }
}

export function find(...args) {
  const rel = path.join.apply(null, [].slice.call(args));

  function findRel(start, relativePath) {
    const filePath = path.join(start, relativePath);

    if (fs.existsSync(filePath)) {
      return filePath;
    }

    if (path.dirname(start) !== start) {
      return findRel(path.dirname(start), relativePath);
    }

    return null;
  }

  return findRel(process.cwd(), rel);
}

export function conditionalTransformKeys(obj, condition, transform) {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (condition === true || condition(key, value)) {
      newObj[transform(key, value)] = value;
    }
  });
  return newObj;
}

export function env(prefix, envVars = process.env) {
  const normalizedPrefix = prefix.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

  const vars = conditionalTransformKeys(
    envVars,
    key => key.indexOf(normalizedPrefix) === 0,
    key => key.substring(normalizedPrefix.length).replace(/[_]+/g, '.'),
  );

  return normalize(vars);
}

export function argv(args) {
  const { _: preservedUnderscore } = args;

  const vars = conditionalTransformKeys(
    args,
    key => key !== '_',
    key => key.replace(/[^a-z0-9]+/gi, '.'),
  );

  vars._ = preservedUnderscore;

  return normalize(vars);
}

