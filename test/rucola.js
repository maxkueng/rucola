var rucola = require('../index');
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var expect = require('chai').expect;

function runApp (env, args, callback) {
  var appPath = path.join(__dirname, 'yoloapp.js');
  var out = '';

  var cmd = spawn(appPath, args, {
    cwd: __dirname,
    env: env
  });

  cmd.stdout.on('data', function (chunk) {
    out += chunk;
  });

  cmd.on('close', function () {
    callback(out);
  });
}

describe('sample cli app', function () {

  describe('defaults', function () {
  
    it('should read values from defaults', function (done) {

      runApp([], [], function (out) {
        out = JSON.parse(out);

        expect(out.colors.blue).to.equal('#0000FF');
        expect(out.colors.green).to.equal('#00FF00');
        expect(out.colors.red).to.equal('#FF0000');

        done();
      });

    });
  
  });

  describe('standard config file path', function () {
  
    it('should read values from a standard config path', function (done) {

      runApp([], [], function (out) {
        out = JSON.parse(out);

        expect(out.animal.mammal).to.equal('bear');
        expect(out.animal.reptile).to.equal('lizard');
        expect(out.animal.bird).to.equal('owl');

        done();
      });

    });
  
  });

  describe('standard config file path from $HOME', function () {
  
    it('should read values from standard config paths', function (done) {

      var env = {
        HOME: path.join(__dirname, 'fakehome')
      };

      runApp(env, [], function (out) {
        out = JSON.parse(out);

        expect(out.capital.china).to.equal('beijing');
        expect(out.capital.japan).to.equal('tokyo');
        expect(out.capital.russia).to.equal('moscow');
        expect(out.capital.peru).to.equal('lima');
        expect(out.capital.thailand).to.equal('bangkok');
        expect(out.capital.colombia).to.equal('bogota');
        expect(out.capital.egypt).to.equal('cairo');

        done();
      });

    });
  
  });

  describe('config file specified by --config', function () {
  
    it('should read values from a specified file in INI format', function (done) {

      var args = [
        '--config', './conf.ini'
      ];

      runApp([], args, function (out) {
        out = JSON.parse(out);

        expect(out.animal.mammal).to.equal('bear');
        expect(out.animal.reptile).to.equal('lizard');
        expect(out.animal.bird).to.equal('owl');
        expect(out.animal.insect).to.equal('mantis');
        expect(out.animal.spider).to.equal('tarantula');
        expect(out.animal.fish).to.equal('catfish');

        done();
      });

    });
  
    it('should read values from a specified file in YAML format', function (done) {

      var args = [
        '--config', './conf.yml'
      ];

      runApp([], args, function (out) {
        out = JSON.parse(out);

        expect(out.animal.mammal).to.equal('bear');
        expect(out.animal.reptile).to.equal('lizard');
        expect(out.animal.bird).to.equal('phoenix');
        expect(out.animal.insect).to.equal('bee');
        expect(out.animal.spider).to.equal('black widow');
        expect(out.animal.fish).to.equal('puffer fish');

        done();
      });

    });
  
    it('should read values from a specified file in JSON format', function (done) {

      var args = [
        '--config', './conf.json'
      ];

      runApp([], args, function (out) {
        out = JSON.parse(out);

        expect(out.animal.mammal).to.equal('bear');
        expect(out.animal.reptile).to.equal('lizard');
        expect(out.animal.bird).to.equal('owl');
        expect(out.animal.insect).to.equal('butterfly');
        expect(out.animal.spider).to.equal('wolfspider');
        expect(out.animal.fish).to.equal('salmon');
        expect(out.animal.crab).to.equal('triops');

        done();
      });

    });
  
  });

  describe('environment variables', function () {

    it('should read environment variables', function (done) {
      
      var env = {
        YOLO_COLORS_GREEN: '#00CC00',
        YOLO_COLORS_RED: '#DD0000',
        YOLO_OVER: 9000
      };

      runApp(env, [], function (out) {
        out = JSON.parse(out);

        expect(out.colors.green).to.equal(env.YOLO_COLORS_GREEN);
        expect(out.colors.red).to.equal(env.YOLO_COLORS_RED);
        expect(out.over).to.equal('' + env.YOLO_OVER);

        done();
      });

    });

  });

  describe('command-line arguments', function () {
  
    it('should read command-line arguments', function (done) {

      var args = [
        'w00t',
        '--colors-green', 'emerald',
        '--colors-red', 'rose',
        '--retract-landinggear',
      ];

      runApp([], args, function (out) {
        out = JSON.parse(out);

        expect(out.colors.green).to.equal(args[2]);
        expect(out.colors.red).to.equal(args[4]);
        expect(out.retract.landinggear).to.be.true;
        expect(out._[0]).to.equal(args[0]);

        done();
      });

    });

    it('should support aliases', function (done) {

      var args = [
        'w00t',
        '-g', 'moss',
        '-r', 'blood',
        '-b', 'sky',
        '-R',
        '--retract-landinggear',
      ];

      runApp([], args, function (out) {
        out = JSON.parse(out);

        expect(out.colors.green).to.equal(args[2]);
        expect(out.colors.red).to.equal(args[4]);
        expect(out.colors.blue).to.equal(args[6]);
        expect(out.recursive).to.be.true;
        expect(out.retract.landinggear).to.be.true;
        expect(out._[0]).to.equal(args[0]);

        done();
      });

    });

    it('should override environment variables with command-line arguments', function (done) {

      var env = {
        YOLO_FOOD_NASTY: 'poop',
        YOLO_FOOD_NICE: 'celery',
        YOLO_FOOD_MEH: 'beetroot',
      };

      var args = [
        '--food-nice', 'broccoli',
        '--w00t'
      ];

      runApp(env, args, function (out) {
        out = JSON.parse(out);

        expect(out.food.nasty).to.equal(env.YOLO_FOOD_NASTY);
        expect(out.food.meh).to.equal(env.YOLO_FOOD_MEH);
        expect(out.food.nice).to.equal(args[1]);
        expect(out.w00t).to.be.true;

        done();
      });

    });
  
  });

});

describe('rucola', function () {

  describe('defaults as string', function () {
  
    it('should read defaults as string in INI format', function () {

      var defaults = fs.readFileSync(path.join(__dirname, 'conf.ini'), 'utf-8');
      var conf = rucola('initest', defaults);

      expect(conf.animal.insect).to.equal('mantis');
      expect(conf.animal.spider).to.equal('tarantula');
      expect(conf.animal.fish).to.equal('catfish');

    });

    it('should read defaults as string in JSON format', function () {

      var defaults = fs.readFileSync(path.join(__dirname, 'conf.json'), 'utf-8');
      var conf = rucola('jsontest', defaults);

      expect(conf.animal.insect).to.equal('butterfly');
      expect(conf.animal.spider).to.equal('wolfspider');
      expect(conf.animal.fish).to.equal('salmon');
      expect(conf.animal.crab).to.equal('triops');

    });

    it('should read defaults as string in YAML format', function () {

      var defaults = fs.readFileSync(path.join(__dirname, 'conf.yml'), 'utf-8');
      var conf = rucola('jsontest', defaults);

      expect(conf.animal.insect).to.equal('bee');
      expect(conf.animal.spider).to.equal('black widow');
      expect(conf.animal.fish).to.equal('puffer fish');
      expect(conf.animal.bird).to.equal('phoenix');

    });
  
  });

  describe('.get()', function () {
  
    it('should retreive values using .get(keyPath)', function () {
      var defaults = fs.readFileSync(path.join(__dirname, 'conf.yml'), 'utf-8');
      var conf = rucola('gettest', defaults);

      expect(conf.get('animal.insect')).to.equal('bee');
      expect(conf.get('animal.dragon')).to.be.undefined;
    });
  
  });

});
