## What's here

This repo provides configuration tooling, with the intent to make a consistent configuration facility available across services. 

The module codifies and implements a few rules intended to make configuration straightforward and predictable. You supply a config file for every environment you intend to support. Code consumers grab config from the module, and should not need, in general cases, to check the environment directly, just use the supplied config values.

Configuration files are separate per-environment, to make separation a little cleaner and reduce the need for code/conditionals in the config file. Ideally, these files are as close as possible to being just simple key-value declarations.

## How It Works

There are 4 supported environment types, mapping to the 3 conventional node environments - `development`, `test`, and `production`, plus an extra `staging`. (We could also also add `local`, since we use that at Pocket, but I skipped that here since maybe that's not something we'll need movig forward).

- First, `Configuration` loads a `.env` file, if there's one in the project root, before loading the environment's config.
- Then, `Configuration` loads `${environment}.ts` from the designated config folder
    - This config file is expected export a default object containing config keys
    - The `test` environment will fall back to `development` if there's no `test.ts` file
    - Similarly, the `staging` environment will fall back to `production` settings. 
- Get the configuration object using `Configuration.getConfig()`
- Access config values via one of the `get` methods. The only one implemented now is `getString()`, we can assume a couple more of these.
## TODOs
### Near term
In bootstrapping this module, I mostly focused on the loading logic; there's sets of work around 
- Accessors, typechecking, defaulting, etc. 
- Packaging for easy resuse across services

Also, tests are passing individually, but the last test is failing in the suite. I _think_ there's an issue with scratch file deletion synchronous-ness. 

### Longer term
- `Configuration` is good consumer access point for feature flag/rollout/test data - to a consuming developer, flags like these basically look like configuration points.

