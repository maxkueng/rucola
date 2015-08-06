![rucola](images/logo.png)
======

_rucola_ is a **ru**ntime **co**nfiguration **l**o**a**der heavily inspired by the amazing
[rc][rc] module.

## Usage

The only argument required is `appname`.

```js
var appname = 'myapp';

var defaults = {
  connection: {
    port: 1337,
    host: '127.0.0.1'
  }
};

var aliases = {
  v: 'version'
};

var conf = require('rucola')(appname, defaults, aliases);

conf.get('connection.port')
// 1337

conf.connection.port;
// 1337

conf.get('i.dont.exist');
// undefined

conf.i.dont.exist
// TypeError: Cannot read property 'dont' of undefined
```

## Configuration Sources

Given your application name is "myapp", rucola will load configuration from the
following sources:

 - command-line arguments
 - environment variables
 - if you passed an option `--config file` then from that file
 - a local `.myapprc` or the first found looking in ./ ../ ../../ ../../../ etc
 - `$HOME/myapprc`
 - `$HOME/myapp/config`
 - `$HOME/.config/myapp`
 - `$HOME/.config/myapp/config`
 - `/etc/myapprc`
 - `/etc/myapp/config`
 - defaults

### File Formats

rucola supports both JSON and INI with comments, and auto-detects the format.

**Example INI file:**

```ini
; this is a comment

yolo = true

[connection]
port = 1337
host = 127.0.0.1

; nested sections

[nice.foods]
green = broccoli
orange = carrots

[nice.colors]
emerald = true
turquoise = false
```

**Same example in JSON:**

```js
// this is a comment

{
  "yolo": true,
  "connection": {
    "port": "1337",
    "host": "127.0.0.1"
  },

// nested sections

  "nice": {
    "foods": {
      "green": "broccoli",
      "orange": "carrots"
    },
    "colors": {
      "emerald": true,
      "turquoise": false
    }
  }
}
```

### Environment Variables and Command-Line Arguments

Command-line arguments and environment variables are converted to objects.
Command-line arguments have priority over environment variables.

#### Command-line Arguments

```sh
myapp --connection-port 1337 --yolo -v
```

becomes:

```js
{
  "connection": {
    "port": 1337
  },
  "yolo": true
}
```

#### Environment Variables

Environment variables need to be prefixed with the application name and are
upper case.

```sh
MYAPP_CONNECTION_PORT=1337 YOLO=true myapp
```

becomes:

```js
{
  "connection": {
    "port": "1337"
  },
  "yolo": "true",
}
```

## License

MIT


[rc]: https://www.npmjs.com/package/rc
