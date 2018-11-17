#!/usr/bin/env node

const rucola = require('../rucola.bundle.js');

const defaults = {
  colors: {
    blue: '#0000FF',
    green: '#00FF00',
    red: '#FF0000',
  },
};

const aliases = {
  b: 'colors.blue',
  g: 'colors.green',
  r: 'colors.red',
  R: 'recursive',
  v: 'version',
};

const conf = rucola('yolo', defaults, aliases);

process.stdout.write(JSON.stringify(conf, null, '  '));
