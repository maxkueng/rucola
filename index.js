var path = require('path');
var minimist = require('minimist');
var utils = require('./lib/utils');
var deepExtend = require('deep-extend');
var seek = require('flatnest').seek;

var isWin = process.platform === 'win32';
var etc = '/etc';
var home = isWin ? process.env.USERPROFILE : process.env.HOME;

module.exports = function (name, defaults, aliases, argv) {
  if (typeof name !== 'string') {
    throw new Error('name argument must be a string');
  }

  aliases = aliases || {};

  defaults = (typeof defaults === 'string'
    ? utils.parse(defaults)
    : defaults) || {};

  argv = utils.argv(argv || minimist([].concat(process.argv).splice(2), {
    alias: aliases
  }), aliases);

  var env = utils.env(name + '_');

  function removeDuplicates (item, index, list) {
    return item && list.indexOf(item) === index;
  }

  function tupleify (item) {
    return [ item, null ];
  }

  function detupleify (index) {
    return function (tuple) {
      return tuple[index];
    };
  }

  function removeFalsy (tuple) {
    return !!tuple[1];
  }

  function loadConfig (tuple) {
    var filePath = tuple[0];
    var content = utils.file(filePath);
    if (content) {
      tuple[1] = utils.parse(content);
    }

    return tuple;
  }

  var allConfigFiles = [
    !isWin  &&  path.join(etc, name, 'config'),
    !isWin  &&  path.join(etc, name + 'rc'),
    !isWin  &&  path.join(etc, 'xdg', name, name + '.rc'),
    home    &&  path.join(home, '.config', name, 'config'),
    home    &&  path.join(home, '.config', name),
    home    &&  path.join(home, '.' + name, 'config'),
    home    &&  path.join(home, '.' + name + 'rc'),
                utils.find('.' + name + 'rc'),
                argv.config
  ]
    .filter(removeDuplicates);

  var configTuples = allConfigFiles
    .map(tupleify)
    .map(loadConfig)
    .filter(removeFalsy);

  var usedConfigFiles = configTuples
    .map(detupleify(0));

  var configValues = configTuples
    .map(detupleify(1));

  var conf = deepExtend.apply(null, [ utils.normalize(defaults) ].concat(configValues, env, argv));

  Object.defineProperty(conf, 'usedConfigs', {
    enumerable: false,
    writable: false,
    value: usedConfigFiles
  });

  Object.defineProperty(conf, 'checkedConfigs', {
    enumerable: false,
    writable: false,
    value: allConfigFiles
  });

  Object.defineProperty(conf, 'get', {
    enumerable: false,
    value: seek.bind(null, conf)
  });

  return conf;
};
