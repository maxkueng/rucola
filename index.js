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

  defaults = defaults || {};
  aliases = aliases || {};

  argv = utils.argv(argv || minimist(process.argv.splice(2), {
    alias: aliases 
  }), aliases);

  var env = utils.env(name + '_');

  function removeDuplicates (item, index, list) {
    return item && list.indexOf(item) === index;
  }

  function removeFalsy (item) {
    return !!item;
  }

  function loadConfig (filePath) {
    var content = utils.file(filePath);
    if (!content) { return null; }
    return utils.parse(content);
  }

  var configFiles = [
    !isWin  &&  path.join(etc, name, 'config'),
    !isWin  &&  path.join(etc, name + 'rc'),
    home    &&  path.join(home, '.config', name, 'config'),
    home    &&  path.join(home, '.config', name),
    home    &&  path.join(home, '.' + name, 'config'),
    home    &&  path.join(home, '.' + name + 'rc'),
                utils.find('.' + name + 'rc'),
                argv.config
  ]
    .filter(removeDuplicates);

  var configs = configFiles
    .map(loadConfig)
    .filter(removeFalsy);

  var conf = deepExtend.apply(null, [utils.normalize(defaults)].concat(configs, env, argv));

  conf.configs = configFiles;
  conf.get = seek.bind(null, conf);

  return conf;
};
