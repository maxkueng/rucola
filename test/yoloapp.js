#!/usr/bin/env node

var rucola = require('../index');

var defaults = {
  colors: {
    blue: '#0000FF',
    green: '#00FF00',
    red: '#FF0000'
  }
};

var aliases = {
  b: 'colors.blue',
  g: 'colors.green',
  r: 'colors.red',
  R: 'recursive',
  v: 'version'
};

var conf = rucola('yolo', defaults, aliases);

console.log(JSON.stringify(conf, null, '  '));
