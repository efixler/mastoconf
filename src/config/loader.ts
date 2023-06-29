import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

type Environment = 'development' | 'production' | 'staging' | 'test';


export class Configuration {
    private static singleton: Configuration;
    public static configFileDir: string = '../../config';
    public static envFileDir: string = '../../';
    private config: any = {};

    private constructor(env: Environment) {
        //const filepath: string = Configuration.getEnvFilePath(env);
        this.loadEnvFile();
        this.loadConfigFile(env);
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
            if (env === 'test') {
                return this.loadConfigFile('development');
            } else {
                //in this we don't have a file. If we want file to be mandatory, we can throw an error here
                return false;
            }
        }
        this.config = require(filepath).default;
        // This means that the file was there, but didn't export 
        // a 'default' property. This most likely indicates a malformed
        // config so let's warn.
        if (this.config === undefined) {
            console.warn(`Config file ${filepath} did not export a default object`);
            this.config = {};
            return false;
        }
        console.log(`Loaded config file ${filepath}`);
        console.log(this.config);
        //dotenv.config({ path: filepath });
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
     * property on the Configuration class. That setting is used for testing.
     * 
     * @returns string The path to the env file
     */
    public static getEnvFilePath(): string {
        const envFilePath = path.resolve(__dirname, Configuration.configFileDir, '.env');
        return envFilePath;
    }

    public static getConfigFilePath(environment: string): string {
        const filePath = path.resolve(__dirname, Configuration.configFileDir, `${environment}.ts`);
        return filePath;
    }

    public static getConfig(refresh:boolean = false): Configuration {
        if (refresh || !Configuration.singleton) {
            const env = process.env.NODE_ENV || 'production';
            Configuration.singleton = new Configuration(env as Environment);
        }
        return Configuration.singleton;
    }
}

export const Config = Configuration.getConfig();
