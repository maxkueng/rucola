const path = require('path');
const minimist = require('minimist');
const utils = require('./lib/utils');
const deepExtend = require('deep-extend');
const seek = require('flatnest').seek;

const isWin = process.platform === 'win32';
const etc = '/etc';
const home = isWin ? process.env.USERPROFILE : process.env.HOME;

module.exports = function rucola(name, defaults, aliases, argv) {
  if (typeof name !== 'string') {
    throw new Error('name argument must be a string');
  }

  aliases = aliases || {};

  defaults = (typeof defaults === 'string'
    ? utils.parse(defaults)
    : defaults) || {};

  argv = utils.argv(argv || minimist([].concat(process.argv).splice(2), {
    alias: aliases,
  }), aliases);

  const env = utils.env(`${name}_`);

  function removeDuplicates(item, index, list) {
    return item && list.indexOf(item) === index;
  }

  function tupleify(item) {
    return [item, null];
  }

  function detupleify(index) {
    return function (tuple) {
      return tuple[index];
    };
  }

  function removeFalsy(tuple) {
    return !!tuple[1];
  }

  function loadConfig(tuple) {
    const filePath = tuple[0];
    const content = utils.file(filePath);
    if (content) {
      tuple[1] = utils.parse(content);
    }

    return tuple;
  }

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
};
