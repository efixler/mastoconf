import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

type Environment = 'development' | 'production' | 'staging' | 'test';

/**
 * Configuration class. The configuration object must be the default object from a file named
 * config/[environment].ts, where [environment] is the value of the NODE_ENV environment variable.
 * 
 * The expected values for NODE_ENV are 'development', 'production', 'staging', and 'test'.
 * 
 * 'staging' and 'test' will use the 'production' and 'development' config files, when their own 
 * config files are absent, respectively. 
 * 
 * Use the static method `Configuration.getInstance()` to get the singleton instance of the
 * Configuration.
 * 
 * The various getXxx methods are used to get values from the configuration. The getXxx methods
 * use JS type coercion to convert the value to the desired type -- since the configuration is
 * loaded dynamically, based on the environment, type can't be ascertained at compile time. Accessor
 * methods all provide for a default value, and return null (or the supplied default) when the specified 
 * key is not found.
 */
export class Configuration {
    private static singleton: Configuration;
    /** 
     * The location for config files 
     * 
     * @type {string}
     * @default process.cwd() + '/config' 
    */
    public static configFileDir: string = path.resolve(process.cwd(), 'config');
     /** 
     * The location for a .env file
     * 
     * @type {string}
     * @default process.cwd() 
    */
    public static envFileDir: string = process.cwd();
    private config: any = {};

    private constructor(env: Environment) {
        this.loadEnvFile();
        this.loadConfigFile(env);
    }

    /**
     * Gets a value from config as a string. When the key is null or undefined, return the default value instead
     * 
     * @param key The path in the config to the value.
     * @param defaultValue 
     * @returns The string value or the default value [null]
     */
    public getString(key: string, defaultValue: string | null = null): string | null {
        const value = this.getNestedConfigValue(key);
        if ((value === undefined) || (value === null)) {
            return defaultValue;
        } 
        return value.toString();
    }

    /**
     * Gets a value from config as an Integer. When the key is not a number, return the default value instead
     * 
     * @param key The path in the config to the value.
     * @param defaultValue 
     * @returns The integer value or the default value [null]
     */
    public getInteger(key: string, defaultValue: number | null = null): number | null {
        const value = this.getNestedConfigValue(key); 
        if (value === null || isNaN(value)) {
            return defaultValue;
        }
        return parseInt(value);
    }

    /**
     * Gets a value from config as a Float. When the key is not a number, return the default value instead
     * 
     * @param key The path in the config to the value.
     * @param defaultValue 
     * @returns The float value or the default value [null]
     */
    public getFloat(key: string, defaultValue: number | null = null): number | null {
        const value = this.getNestedConfigValue(key);
        if (value === null || isNaN(value)) {
            return defaultValue;
        }
        return parseFloat(value);
    }

    /**
     * Gets a value from config as a boolean. 
     * 
     * When the key is not a number, return the default value instead
     * 
     * @param key The path in the config to the value.
     * @param defaultValue 
     * @returns The boolean value or the default value [null]
     */
    public getBoolean(key: string, defaultValue: boolean | null = null): boolean | null {
        const value = this.getNestedConfigValue(key);
        if (value === null || value === undefined) {
            return defaultValue;
        }
        return !!value;
    }

    /**
     * Gets an array from config. If the key's value contains an array with items, return the array, 
     * otherwise return the default value.
     * 
     * @param key string The config key
     * @param defaultValue Default value [null]
     * @returns The array value or the default value
     */
    public getArray(key: string, defaultValue: Array<any> | null = null): Array<any> | null {
        const value = this.getNestedConfigValue(key);
        if (value === null || value === undefined || !Array.isArray(value) || value.length === 0) {
            return defaultValue;
        }
        return value;
    }

    /**
     * Gets a value from config that's an object. If the value is not present, not an object,
     * or is an empty object, return the default value instead. 
     * 
     * Direct access to configuration values is preferred, but this method is provided if there's a need
     * for object subkeys.
     * 
     * @param key 
     * @param defaultValue 
     * @returns The object, or the default when empty, null, or not an object
     */
    public getObject(key: string, defaultValue: object | null = null): object | null {
        const value = this.getNestedConfigValue(key);
        if (value === null || value === undefined) {
            return defaultValue;
        }
        if (typeof value !== 'object' || Object.keys(value).length === 0 || Array.isArray(value)) {
            return defaultValue;
        }
        return value;
    }

    /**
     * Gets a nested value from the config object 
     * 
     * @param key The path in the config to the value.
     * @returns The value, or undefined if it doesn't exist
     */
    private getNestedConfigValue(key: string): any {
        const keys = key.split('.');
        let value = this.config;
        while (keys.length > 0) {
            const k:string = keys.shift() as string;
            if (value[k] === undefined) {
                return null;
            }
            value = value[k];
        }
        return value;
    }

    /**
     * Load a config file for the given environment. File is optional, 
     * will return false if file is not found.
     * 
     * This method contains fallbacks for the test and staging environments. 
     * If there's no test.ts file, in test, we'll fall back to development.ts, 
     * and do the same for staging with the production file.
     * 
     * @param env: Environment The environment to load
     * @returns boolean Whether the file was actually loaded or not
     */
    private loadConfigFile(env: Environment): boolean {
        let filepath: string = Configuration.getConfigFilePath(env);
        try {
            fs.accessSync(filepath, fs.constants.R_OK);
        } catch (err) {
            switch (env) {
                case 'test':
                    return this.loadConfigFile('development');
                case 'staging':
                    return this.loadConfigFile('production');
                default:
                    return false;
            }
        }
        // NB: If for some reason you want to reload config (which you shouldn't need to ever do outside test)
        // you'll need to delete the module from require cache first. Otherwise, you'll get the same object back.
        this.config = require(filepath).default;
        // This means that the file was there, but didn't export 
        // a 'default' property. This most likely indicates a malformed
        // config so let's warn.
        if (this.config === undefined) {
            console.warn(`Config file ${filepath} did not export a default object`);
            this.config = {};
            return false;
        }
        return true;
    }

    /**
     * Load an env file. By default, this will load the .env file in the project root.
     * 
     * The env file will be loaded before the config file, 
     * so expected environment variables can be referenced in 
     * the config file.
     * 
     * @param env: Environment The environment to load
     * @returns boolean Whether the file was actually loaded or not
     */
    private loadEnvFile(): boolean {
        let filepath: string = Configuration.getEnvFilePath();
        try {
            fs.accessSync(filepath, fs.constants.R_OK);
        } catch (err) {
            return false;
        }
        const result = dotenv.config({ path: filepath });
        if (result.error) {
            console.error(`Error loading env file ${filepath}: ${result.error}`);
            return false;
        } 
        return true;
    }

    /**
     * Gets the path to an env file. This is typically .env in the project's root 
     * folder. The location of the env file can be changed by setting the configFileDir
     * property on the Configuration class. That setting is used for testing, or to 
     * set the config file path before calling getConfig(). 
     * 
     * @returns string The path to the env file
     */
    public static getEnvFilePath(): string {
        const envFilePath = path.resolve(__dirname, Configuration.configFileDir, '.env');
        return envFilePath;
    }
    /**
     * Gets the path to a config file for the given environment.
     * 
     * @param environment The environment to load
     * @returns string The path to the config file
     */
    public static getConfigFilePath(environment: string): string {
        const filePath = path.resolve(__dirname, Configuration.configFileDir, `${environment}.ts`);
        return filePath;
    }

    /**
     * Static accessor for the singleton instance of the Configuration class.
     * 
     * @param refresh: boolean Whether to reload the config file or not (for unit testing)
     * @returns The singleton instance of the Configuration class
     */
    public static getConfig(refresh:boolean = false): Configuration {
        if (refresh || !Configuration.singleton) {
            const env = process.env.NODE_ENV || 'production';
            Configuration.singleton = new Configuration(env as Environment);
        }
        return Configuration.singleton;
    }
}
