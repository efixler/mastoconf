import { Configuration } from './loader';
import fs from 'fs-extra';
import path from 'path';

describe('Tests for config loading and value access', () => {
    let oldConfigFileDir: string = Configuration.configFileDir;
    
    beforeAll( () => {
        createTestConfigDirectory();
    });

    afterAll( () => {
        removeTestConfigDirectory();
        Configuration.configFileDir = oldConfigFileDir;
    });

    afterEach( () => {
        jest.restoreAllMocks();
        process.env.NODE_ENV = 'test';
        removeTestConfigFiles();
    });

    it('picks up the node environment correctly and falls back correctly in test', () => {
        // Just making sure
        process.env.NODE_ENV = 'test';
        const factorySpy = jest.spyOn(Configuration, 'getConfig');
        const confFileSpy = jest.spyOn(Configuration, 'getConfigFilePath' as any);
        const configInstance = Configuration.getConfig(true);
        expect(factorySpy).toHaveBeenCalled();
        expect(confFileSpy).toHaveBeenCalledTimes(2);
        expect(confFileSpy).toHaveBeenLastCalledWith('development');
        expect(confFileSpy).toHaveBeenNthCalledWith(1, 'test');
        let configFilePath: string = confFileSpy.mock.results[0].value as string;
        expect(configFilePath.endsWith('/test.ts')).toBe(true);
        configFilePath = confFileSpy.mock.results[1].value as string;
        expect(configFilePath.endsWith('/development.ts')).toBe(true);
    });
    it('falls back to production in staging if there is no staging conf', () => {
        process.env.NODE_ENV = 'staging';
        const factorySpy = jest.spyOn(Configuration, 'getConfig');
        const confFileSpy = jest.spyOn(Configuration, 'getConfigFilePath' as any);
        const configInstance = Configuration.getConfig(true);
        expect(factorySpy).toHaveBeenCalled();
        expect(confFileSpy).toHaveBeenCalledTimes(2);
        expect(confFileSpy).toHaveBeenLastCalledWith('production');
        expect(confFileSpy).toHaveBeenNthCalledWith(1, 'staging');
        let configFilePath: string = confFileSpy.mock.results[0].value as string;
        expect(configFilePath.endsWith('/staging.ts')).toBe(true);
        configFilePath = confFileSpy.mock.results[1].value as string;
        expect(configFilePath.endsWith('/production.ts')).toBe(true);
    });
    it('defaults to production when no NODE_ENV is set', () => {
        process.env.NODE_ENV = '';
        const factorySpy = jest.spyOn(Configuration, 'getConfig');
        const confFileSpy = jest.spyOn(Configuration, 'getConfigFilePath' as any);
        const configInstance = Configuration.getConfig(true);
        expect(factorySpy).toHaveBeenCalled();
        expect(confFileSpy).toHaveBeenCalledWith('production');
    });
    it('will successfully load the test files when present', () => {
        createEnvFile(
            Configuration.getEnvFilePath(), 
            { TEST_KEY: 'test_env_value' }
        );
        createConfigFile(
            Configuration.getConfigFilePath('test'),
            { test_key: 'test_value_1' }
        );
        const factorySpy = jest.spyOn(Configuration, 'getConfig');
        const envFileSpy = jest.spyOn(Configuration, 'getEnvFilePath' as any);
        const confFileSpy = jest.spyOn(Configuration, 'getConfigFilePath' as any);
        const configInstance = Configuration.getConfig(true);
        expect(factorySpy).toHaveBeenCalled();
        expect(envFileSpy).toHaveBeenCalled();
        expect(confFileSpy).toHaveBeenLastCalledWith('test');
        expect(process.env.TEST_KEY).toBe('test_env_value');
        expect(configInstance.getString('test_key')).toBe('test_value_1');
    });
    it('will return the default value if there is no key in the config', () => {
        createConfigFile(
            Configuration.getConfigFilePath('test'),
            { test_key: 'test_value_2' }
        );
        const configInstance = Configuration.getConfig(true);
        expect(configInstance.getString('nonexistent_key', 'default_value')).toBe('default_value');
        expect(configInstance.getString('test_key', 'default_value')).toBe('test_value_2');
    });
    it('will return a nested value correctly', () => {
        createConfigFile(
            Configuration.getConfigFilePath('test'),
            { test_key: { nested_key: 'test_value_nested' } }
        );
        const configInstance = Configuration.getConfig(true);
        expect(configInstance.getString('test_key.nested_key')).toBe('test_value_nested');
        expect(configInstance.getString('test_key.nested__no_key', 'default_value')).toBe('default_value');
    });
});

function createEnvFile(path: string, contents: Object): void {
    const envContent = Object.entries(contents)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    fs.outputFileSync(path, envContent);
}

function createConfigFile(path: string, contents: Object): void {
    const configContent = `export default ${JSON.stringify(contents, null, 4)};`;
    try { 
        fs.outputFileSync(path, configContent);
    } catch (err) {
        console.error(`Error writing config file: ${err}`);
    }
}

const createTestConfigDirectory = () => {
    Configuration.configFileDir = path.resolve('./_testconfigs');
    try {
        if (fs.existsSync(Configuration.configFileDir)) return;
        fs.ensureDirSync(Configuration.configFileDir);
    } catch (err) {
        throw (err);
    }
};

const removeTestConfigDirectory = () => {
    try { 
        fs.removeSync(Configuration.configFileDir)
    } catch(error) { 
        console.error(`Error deleting ${Configuration.configFileDir}:`, error); 
    };
};

const removeTestConfigFiles = () => {
    try { 
        fs.emptyDirSync(Configuration.configFileDir);
    } catch(error) { 
        console.error('Error emptying directory:', error); 
    }
    jest.resetModules();
};
