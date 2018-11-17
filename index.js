import path from 'path';
import minimist from 'minimist';
import deepExtend from 'deep-extend';
import { seek } from 'flatnest';
import * as utils from './lib/utils';

const isWin = process.platform === 'win32';
const etc = '/etc';
const home = isWin ? process.env.USERPROFILE : process.env.HOME;

function removeDuplicates(item, index, list) {
  return item && list.indexOf(item) === index;
}

function tupleify(item) {
  return [item, null];
}

function detupleify(index) {
  return tuple => tuple[index];
}

function removeFalsy(tuple) {
  return !!tuple[1];
}

function loadConfig(tuple) {
  const [filePath] = tuple;

  const content = utils.file(filePath);
  if (content) {
    return [
      filePath,
      utils.parse(content),
    ];
  }

  return tuple;
}

export default function rucola(name, defaultArgs = {}, aliases = {}, customArgv) {
  if (typeof name !== 'string') {
    throw new Error('name argument must be a string');
  }

  const defaults = typeof defaultArgs === 'string'
    ? utils.parse(defaultArgs)
    : defaultArgs;

  const argv = utils.argv(customArgv || minimist([].concat(process.argv).splice(2), {
    alias: aliases,
  }), aliases);

  const env = utils.env(`${name}_`);

  const allConfigFiles = [
    !isWin && path.join(etc, name, 'config'),
    !isWin && path.join(etc, `${name}rc`),
    !isWin && path.join(etc, 'xdg', name, `${name}.rc`),
    home && path.join(home, '.config', name, 'config'),
    home && path.join(home, '.config', name),
    home && path.join(home, `.${name}`, 'config'),
    home && path.join(home, `.${name}rc`),
    utils.find(`.${name}rc`),
    argv.config,
  ]
    .filter(removeDuplicates);

  const configTuples = allConfigFiles
    .map(tupleify)
    .map(loadConfig)
    .filter(removeFalsy);

  const usedConfigFiles = configTuples
    .map(detupleify(0));

  const configValues = configTuples
    .map(detupleify(1));

  const conf = deepExtend(...[utils.normalize(defaults)].concat(configValues, env, argv));

  Object.defineProperty(conf, 'usedConfigs', {
    enumerable: false,
    writable: false,
    value: usedConfigFiles,
  });

  Object.defineProperty(conf, 'checkedConfigs', {
    enumerable: false,
    writable: false,
    value: allConfigFiles,
  });

  Object.defineProperty(conf, 'get', {
    enumerable: false,
    value: seek.bind(null, conf),
  });

  return conf;
}
