## mosc-config configuration

This module provides a configuration facility for straightforward, per-environment configuration, with runtime typechecking in both Typescript and Javascript environments.

The intent is to provide a small but useful feature set to serve common requirements and standarding configuration paradigms across multiple projects, without any
environment-checking in your code.

### Features
- Separate configuration files for each environment
- Configuration is a plain JS object
- Safe type-checking for strings, booleans, floats and arrays
- Supports nested objects
- Inline defaulting
- .env preloading
- 4 environments: `development`, `test`, `staging`, `production`
- Fallback configuration for test and staging environments

### Quickstart

The default location for config files is `process.cwd() + /config` (this is configurable too)
 
 #### `config/development.ts`
``` 
export default  {
    api_server: 'https://toolbox.dev',
    api_server_timeout: 5
    api_client_secret: process.env.CLIENT_SECRET,
    squizzle_enabled: true,
    db { 
        server: 'db.toolbox.dev:5432'
    }
};

```
#### Your code
```
import { Configuration } from 'config'

const config = Configuration.getConfig();

const api_server = config.getString('api_server'); // https://toolbox.dev
const do_squizzle = config.getBoolean(squizzle_enabled, false); // true; if absent from config, it'll be false
const db_server = config.get('db.server'); // db.toolbox.dev:5432
const db_username = config.get(db.username'); // null, since not in file and no default.
```




The module codifies and implements a few rules intended to make configuration straightforward and predictable. You supply a config file for every environment you intend to support. Code consumers grab config from the module, and should not need, in general cases, to check the environment directly, just use the supplied config values.

Configuration files are separate per-environment, to make separation a little cleaner and reduce the need for code/conditionals in the config file. Ideally, these files are as close as possible to being just simple key-value declarations.

### How It Works

There are 4 supported environment types, mapping to the 3 conventional node environments - `development`, `test`, and `production`, plus an extra `staging`.

- First, `Configuration` loads a `.env` file, if there's one in cwd, before loading the environment's config.
- Then, `Configuration` loads `${environment}.ts` from the designated config folder
    - This config file is expected to export a default object containing config keys
    - The `test` environment will fall back to `development` if there's no `test.ts` file
    - Similarly, the `staging` environment will fall back to `production` settings. 
- Set config and env directories (before grabbing an instance) with `Configuration.configFileDir` and `Configuration.envFileDir`
- Get the configuration object using `Configuration.getConfig()`
- Access config values via one of the `get` methods. 
    - `getArray()`
    - `getFloat()`
    - `getInteger()`
    - `getObject()`
    - `getString()`

The tests are probably to best way to see usage in-action. Also see the docs in the docs folder.

### Future/TODO
- `Configuration` is a good access point for feature, rollout, and experiment inclusion checking, this is a possibilty down the road, either via subclassing or via interfaces to these related systems.


