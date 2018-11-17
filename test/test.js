import path from 'path';
import fs from 'fs';
import { fork } from 'child_process';
import test from 'ava';
import rucola from '../rucola.bundle';

function runApp(env = [], argv = [], parseOutput = true) {
  return new Promise((resolve) => {
    const appPath = path.join(__dirname, 'yoloapp.js');
    let out = '';

    const proc = fork(appPath, argv, {
      cwd: __dirname,
      silent: true,
      env,
    });

    proc.stdout.on('data', (chunk) => {
      out += chunk;
    });

    proc.on('close', () => {
      if (parseOutput) {
        resolve(JSON.parse(out));
        return;
      }
      resolve(out);
    });
  });
}

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    const resolvedPath = path.resolve(__dirname, filePath);
    fs.readFile(resolvedPath, 'utf-8', (err, contents) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(contents);
    });
  });
}

test('cli: default values', async (t) => {
  const out = await runApp();
  t.log(out);

  t.is(out.colors.blue, '#0000FF');
  t.is(out.colors.green, '#00FF00');
  t.is(out.colors.red, '#FF0000');
});

test('cli: standard config file path', async (t) => {
  const out = await runApp();
  t.log(out);

  t.is(out.animal.mammal, 'bear');
  t.is(out.animal.reptile, 'lizard');
  t.is(out.animal.bird, 'owl');
});

test('cli: standard config file path from $HOME', async (t) => {
  const env = {
    HOME: path.join(__dirname, 'fakehome'),
  };
  const out = await runApp(env);
  t.log(out);

  t.is(out.capital.china, 'beijing');
  t.is(out.capital.japan, 'tokyo');
  t.is(out.capital.russia, 'moscow');
  t.is(out.capital.peru, 'lima');
  t.is(out.capital.thailand, 'bangkok');
  t.is(out.capital.colombia, 'bogota');
  t.is(out.capital.egypt, 'cairo');
});

test('cli: config file specified through --config in INI format', async (t) => {
  const args = [
    '--config', './conf.ini',
  ];
  const out = await runApp([], args);
  t.log(out);

  t.is(out.animal.mammal, 'bear');
  t.is(out.animal.reptile, 'lizard');
  t.is(out.animal.bird, 'owl');
  t.is(out.animal.insect, 'mantis');
  t.is(out.animal.spider, 'tarantula');
  t.is(out.animal.fish, 'catfish');
});

test('cli: config file specified through --config in YAML format', async (t) => {
  const args = [
    '--config', './conf.yml',
  ];
  const out = await runApp([], args);
  t.log(out);

  t.is(out.animal.mammal, 'bear');
  t.is(out.animal.reptile, 'lizard');
  t.is(out.animal.bird, 'phoenix');
  t.is(out.animal.insect, 'bee');
  t.is(out.animal.spider, 'black widow');
  t.is(out.animal.fish, 'puffer fish');
});

test('cli: config file specified through --config in JSON format', async (t) => {
  const args = [
    '--config', './conf.json',
  ];
  const out = await runApp([], args);
  t.log(out);

  t.is(out.animal.mammal, 'bear');
  t.is(out.animal.reptile, 'lizard');
  t.is(out.animal.bird, 'owl');
  t.is(out.animal.insect, 'butterfly');
  t.is(out.animal.spider, 'wolfspider');
  t.is(out.animal.fish, 'salmon');
  t.is(out.animal.crab, 'triops');
});

test('cli: read environment variables', async (t) => {
  const env = {
    YOLO_COLORS_GREEN: '#00CC00',
    YOLO_COLORS_RED: '#DD0000',
    YOLO_OVER: 9000,
    YOLO_DONKEY_MINERALS_PLANNING_STEP: 'wave',
  };
  const out = await runApp(env);
  t.log(out);

  t.is(out.colors.green, env.YOLO_COLORS_GREEN);
  t.is(out.colors.red, env.YOLO_COLORS_RED);
  t.is(out.over, String(env.YOLO_OVER));
  t.is(out.donkey.minerals.planning.step, env.YOLO_DONKEY_MINERALS_PLANNING_STEP);
});

test('cli: command-line arguments', async (t) => {
  const args = [
    'w00t',
    '--colors-green', 'emerald',
    '--colors-red', 'rose',
    '--retract-landinggear',
    '--missing-nails-plural=slope',
  ];
  const out = await runApp([], args);
  t.log(out);

  t.is(out.colors.green, args[2]);
  t.is(out.colors.red, args[4]);
  t.true(out.retract.landinggear);
  t.is(out.missing.nails.plural, 'slope');
  t.is(out._[0], args[0]);
});

test('cli: command-line aliases', async (t) => {
  const args = [
    'w00t',
    '-g', 'moss',
    '-r', 'blood',
    '-b', 'sky',
    '-R',
    '--retract-landinggear',
  ];
  const out = await runApp([], args);
  t.log(out);

  t.is(out.colors.green, args[2]);
  t.is(out.colors.red, args[4]);
  t.is(out.colors.blue, args[6]);
  t.true(out.recursive);
  t.true(out.retract.landinggear);
  t.is(out._[0], args[0]);
});

test('cli: command-line arguments should override evironment variables', async (t) => {
  const env = {
    YOLO_FOOD_NASTY: 'poop',
    YOLO_FOOD_NICE: 'celery',
    YOLO_FOOD_MEH: 'beetroot',
  };

  const args = [
    '--food-nice', 'broccoli',
    '--w00t',
  ];
  const out = await runApp(env, args);
  t.log(out);

  t.is(out.food.nasty, env.YOLO_FOOD_NASTY);
  t.is(out.food.meh, env.YOLO_FOOD_MEH);
  t.is(out.food.nice, args[1]);
  t.true(out.w00t);
});

test('module: fail without  an appname', (t) => {
  const thrower = () => {
    rucola();
  };
  t.throws(() => thrower());
});

test('module: read defaults as string in INI format', async (t) => {
  const defaults = await readFile('conf.ini');
  const conf = rucola('initest', defaults);

  t.is(conf.animal.insect, 'mantis');
  t.is(conf.animal.spider, 'tarantula');
  t.is(conf.animal.fish, 'catfish');
});

test('module: read defaults as string in YAML format', async (t) => {
  const defaults = await readFile('conf.yml');
  const conf = rucola('yamltest', defaults);

  t.is(conf.animal.insect, 'bee');
  t.is(conf.animal.spider, 'black widow');
  t.is(conf.animal.fish, 'puffer fish');
  t.is(conf.animal.bird, 'phoenix');
});

test('module: read defaults as string in JSON format', async (t) => {
  const defaults = await readFile('conf.json');
  const conf = rucola('jsontest', defaults);

  t.is(conf.animal.insect, 'butterfly');
  t.is(conf.animal.spider, 'wolfspider');
  t.is(conf.animal.fish, 'salmon');
  t.is(conf.animal.crab, 'triops');
});

test('module: get values using get(keyPath)', async (t) => {
  const defaults = await readFile('conf.yml');
  const conf = rucola('gettest', defaults);

  t.is(conf.get('animal.insect'), 'bee');
  t.is(conf.get('animal.dragon'), undefined);
});

test('module: .checkedConfigs', async (t) => {
  const conf = rucola('cctest');
  const { checkedConfigs } = conf;
  t.log(checkedConfigs);

  t.true(Array.isArray(checkedConfigs));
  t.true(checkedConfigs.includes('/etc/cctest/config'));
  t.true(checkedConfigs.includes('/etc/cctestrc'));
});

test('module: .usedConfigs', async (t) => {
  const conf = rucola('uctest');
  const { usedConfigs } = conf;
  t.log(usedConfigs);

  t.true(Array.isArray(usedConfigs));
});

