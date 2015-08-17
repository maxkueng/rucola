![rucola](images/logo.png)
======

_rucola_ is a unix-style **ru**ntime **co**nfiguration **l**o**a**der
for Node.js apps that allows you to configure your application using
configuration files in JSON, INI and YAML format, command-line
arguments, and environment variables.  
It's heavily inspired by the amazing [rc][rc] module but it does things
slightly different.

## Sample Usage

The only argument required is `appname`. But in this example we're also
providing default values and defining some aliases.

```js

// The name of your app. It should be a string with no spaces and
// special characters. Kind of like an npm module name.
var appname = 'myapp';

// An object containing your default values. Make sure you cover
// everything essential to your app.
var defaults = {
  connection: {
    port: 1337,
    host: '127.0.0.1'
  }
};

// An object mapping aliases to config properties. Use the dot-notation
// to define aliases for nested properties.
var aliases = {
  p: 'connection.port',
  h: 'connection.host',
  r: 'color.red',
  R: 'recursive',
  v: 'version'
};

// Load the configuration.
var conf = require('rucola')(appname, defaults, aliases);

// use conf.get() to read config variables 
// without throwing TypeErrors.
conf.get('connection.port')
// 1337

conf.connection.port;
// 1337

conf.get('i.dont.exist');
// undefined

conf.i.dont.exist
// TypeError: Cannot read property 'dont' of undefined
```

## Documentation

### API

#### conf = rucola(appname [, defaults [, aliases]])

Loads your configuration from all sources and returns an object
containing all values.

```js
var conf = require('rucola')('myapp', defaults, aliases);
```

**`appname`**

The `appname` is your application's name. It will be used as a prefix
for environment variables and in the name of your configuration files.
It should be lower-cased without any spaces and other special
characters. Kind of like you would name a module on npm.

**`defaults`**

The default values for your configuration. You don't have to cover every
possible value but you should provide default values for all essential
settings so your app can run without a configuration file.

The defaults can be either an object, or a string in any of the
supported formats.

```js
var defaults = {
  connection: {
    host: 'localhost',
    port: 8080
  }
};

var conf = require('rucola')('myapp', defaults);
```

```js
var path = require('path');
var fs = require('fs');

// Load defaults from an external file in any supported format.
var defaults = fs.readFileSync(path.join(__dirname, 'defaults.ini'), 'utf-8');

var conf = require('rucola')('myapp', defaults);
```

**`aliases`**

An object to define short aliases (like `-R` for `--recursive` or `-u`
for `--user`) for command-line arguments. If you want to define an alias
for a nested property use the dot-notation.

```js
var defaults = {
  connection: {
    host: 'localhost',
    port: 8080
  }
};

var aliases = {
  h: 'connection.host',
  p: 'connection.port',
  v: 'version',
  V: 'verbose'
};

var conf = require('rucola')('myapp', defaults, aliases);
```

Now you can use them as command-line arguments:

```sh
$ myapp -h 127.0.0.1 -p 8000 -V
```

which is the same as:

```sh
$ myapp --connection-host 127.0.0.1 --connection-port 8000 --verbose
```

#### value = conf.get(key)

`conf.get()` is a method to safely read config values of nested objects
without throwing TypeErrors. You can use the dot-notation to access
nested properties.

```js
var defaults = {
  connection: {
    host: 'localhost',
    port: 8080
  }
};

var conf = require('rucola')('myapp', defaults);

conf.get('connection.host');
// 'localhost'

conf.get('server.hostname');
// undefined
```

Accessing `conf.server.hostname` directly would throw a TypeError
because `conf.server` is undefined.

#### arr = conf.checkedConfigs

The `conf.checkedConfigs` property is an array containing all file paths
that have been checked values.

#### arr = conf.usedConfigs

The `conf.usedConfigs` property is an arry containing all file paths
from which values have been loaded from.

### Normalization

All configuration options are normalized into a nested object structure
with lower-case keys. Regardless of file format, environment variable,
or command-line argument.

The following all translate into the following object:

```js
{
  server: {
    connection: {
      host: "localhost",
      port: "9000"
    }
  }
}
```

#### Environment Variables

```sh
MYAPP_SERVER_CONNECTION_HOST=localhost \
MYAPP_SERVER_CONNECTION_PORT=9000 \
myapp
```

```sh
MYAPP_sErVeR_CoNNEcTION_hOsT=localhost \
MYAPP_SerVer_coNneCtiOn_PorT=9000 \
myapp
```

#### Command-Line Arguments

```sh
myapp --server-connection-host localhost \
      --server-connection-port 9000
```

```sh
myapp --sERvER-COnNEcTIoN-hOSt localhost \
      --SErVEr-CoNNeCtIOn-pOrt 9000
```

#### Config Files

**JSON:**

```js
{
  "server": {
    "connection": {
      "host": "localhost",
      "port": "9000"
    }
  }
}
```

```js
{
  "Server.Connection": {
    "Host": "localhost",
    "Port": "9000"
  }
}
```

```js
{
  "SERVER.Connection.host": "localhost",
  "SERVER.Connection.port": "9000"
}
```

**INI:**

```ini
[server]
connection.host = localhost
connection.port = 9000
```

```ini
[Server.Connection]
host = localhost
port = 9000
```

```ini
SERVER.connection.host = localhost
SERVER.connection.port = 9000
```

**YAML:**

```yaml
server:
  connection:
    host: localhost
    port: 9000
```


```yaml
Server.Connection:
  Host: localhost
  Port: 9000
```

```yaml
SERVER.Connection.Host: localhost
SERVER.Connection.Port: 9000
```


### Configuration Sources

Given your application name is "myapp", rucola will load configuration
values from the following sources in this paricular order from bottom to
top.

 - command-line arguments
 - environment variables
 - if you passed an option `--config file` then from that file
 - a local `.myapprc` or the first found looking in ./ ../ ../../ ../../../ etc
 - `$HOME/.myapprc`
 - `$HOME/.myapp/config`
 - `$HOME/.config/myapp`
 - `$HOME/.config/myapp/config`
 - `/etc/xdg/myapp/myapp.rc` _(unix-style only)_
 - `/etc/myapprc` _(unix-style only)_
 - `/etc/myapp/config` _(unix-style only)_
 - defaults

### File Formats

rucola supports JSON (with comments), INI and YAML, and auto-detects the
format.

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

**Same example in YAML:**

```yaml
---
# this is a comment

yolo: true

connection:
  port: 1337
  host: 127.0.0.1

# nested sections

nice.foods:
  green: broccoli
  orange: carrots

nice.colors:
  emerald: true
  turquoise: false
```

### Environment Variables

Environment variables need to be prefixed with the application name and are
upper case. Keep in mind that environment variables always have string
values. So you may have to type cast the values into whetever you need.

```sh
MYAPP_CONNECTION_PORT=1337 YOLO=true myapp
```

becomes:

```js
{
  connection: {
    port: "1337"
  },
  yolo: "true",
}
```

### Command-line Arguments

```sh
myapp --connection-port 1337 --yolo
```

becomes:

```js
{
  connection: {
    port: 1337
  },
  yolo: true
}
```

## Difference Between rucola And rc

The big difference between rucola and rc is that rucola normalizes
everything so you can use environment variables and command-line
arguments in a way a user would expect to use them.

If your app name is "myapp" and you wanted the following config object,

```js
{
  connection: {
    host: "localhost",
    port: 9000
  }
}
```

in rc you would have to use environment variables like this (with double
unserscores for nested properties):

```sh
myapp_connection__host=localhost \
myapp_connection__port=9000 \
myapp
```

and command-line arguments like this:

```sh
myapp --connection.host localhost --connection.port 9000
```

which feels unnatural in a unix-like environment.

With rucola you can use environment variables like this:

```sh
MYAPP_CONNECTION_HOST=localhost \
MYAPP_CONNECTION_PORT=9000 \
myapp
```

and command-line arguments like this:

```sh
myapp --connection-host localhost --connection-port 9000
```

which is much closer to what a user might expect.

### Things that rucola can and rc can't:

 - Nice command-line arguments and environment variables
 - Provides `.get()` function to access values without throwing
   TypeErrors
 - Provide a list of files from which values were read from
 - Support for aliases
 - Support YAML format

### Things that rc can and rucola can't (yet):

 - Swap out minimist for a different option parser


## License

MIT


[rc]: https://www.npmjs.com/package/rc
