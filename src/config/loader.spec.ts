import { Configuration } from '.';
import fs from 'fs-extra';
import path from 'path';

describe('Tests for config loading and value access', () => {
    let oldConfigFileDir: string = Configuration.configFileDir;

    beforeAll(() => {
        createTestConfigDirectory();
    });

    afterAll(() => {
        removeTestConfigDirectory();
        Configuration.configFileDir = oldConfigFileDir;
    });

    afterEach(() => {
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
    it('getString will return actual and default values correctly', () => {
        createConfigFile(
            Configuration.getConfigFilePath('test'),
            { test_key: 'test_value_2', test_key_2: 100 }
        );
        const configInstance = Configuration.getConfig(true);
        expect(configInstance.getString('nonexistent_key', 'default_value')).toBe('default_value');
        expect(configInstance.getString('test_key', 'default_value')).toBe('test_value_2');
        expect(configInstance.getString('no_test_key', 'default_value')).toBe('default_value');
        expect(configInstance.getString('no_test_key', null)).toBe(null);
        expect(configInstance.getString('no_test_key', undefined)).toBe(null);
        expect(configInstance.getString('test_key_2', null)).toBe("100");
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
    it('getInteger will return a real and default values correctly', () => {
        createConfigFile(
            Configuration.getConfigFilePath('test'),
            {
                test_real_int: 100,
                test_string_int: '100',
                test_float: 100.5,
                test_float_string: '100.5',
                test_string: 'test_string',
                test_string_lead_num: '100test_string',
                test_string_tail_num: 'test_string100'
            }
        );
        const configInstance = Configuration.getConfig(true);
        expect(configInstance.getInteger('test_real_int')).toBe(100);
        expect(configInstance.getInteger('test_string_int')).toBe(100);
        expect(configInstance.getInteger('test_float')).toBe(100);
        expect(configInstance.getInteger('test_float_string')).toBe(100);
        expect(configInstance.getInteger('test_no_key', 200)).toBe(200);
        expect(configInstance.getInteger('test_string')).toBe(null);
        expect(configInstance.getInteger('test_string_lead_num')).toBe(null);
        expect(configInstance.getInteger('test_string_tail_num')).toBe(null);
    });
    it('getFloat will return a real and default values correctly', () => {
        createConfigFile(
            Configuration.getConfigFilePath('test'),
            { 
                test_real_float: 100.5, 
                test_string_float: '100.5', 
                test_int_float: 100, 
                test_int_string: '100',
                test_string_lead_num: '100.5test_string',
                test_string_tail_num: 'test_string100.5'
            }
        );
        const configInstance = Configuration.getConfig(true);
        expect(configInstance.getFloat('test_real_float')).toBe(100.5);
        expect(configInstance.getFloat('test_string_float')).toBe(100.5);
        expect(configInstance.getFloat('test_int_float')).toBe(100.0);
        expect(configInstance.getFloat('test_int_string')).toBe(100.0);
        expect(configInstance.getFloat('test_no_float', 100.5)).toBe(100.5);
        expect(configInstance.getFloat('test_string_lead_num')).toBe(null);
        expect(configInstance.getFloat('test_string_tail_num')).toBe(null);
    });
    it('getBoolean will return a real and default values correctly', () => {
        createConfigFile(
            Configuration.getConfigFilePath('test'),
            { 
                true: true, 
                false: false, 
                null: null,
                one: 1,
                zero: 0,
                one_string: '1',
                zero_string: '0',
                empty_string: '',
                string: 'string',
            }
        );
        const configInstance = Configuration.getConfig(true);
        expect(configInstance.getBoolean('true')).toBe(true);
        expect(configInstance.getBoolean('false')).toBe(false);
        expect(configInstance.getBoolean('null')).toBe(null);
        expect(configInstance.getBoolean('null', true)).toBe(true);
        expect(configInstance.getBoolean('one')).toBe(true);
        expect(configInstance.getBoolean('zero')).toBe(false);
        expect(configInstance.getBoolean('empty_string')).toBe(false);
        expect(configInstance.getBoolean('string')).toBe(true);
    });
    it('getObject will return only a k/v object', () => {
        createConfigFile(
            Configuration.getConfigFilePath('test'),
            { 
                object: { key: 'value' },
                empty_object: {},
                string: 'string',
                string_object : new String('foo'),
                number: 100,
                array: [1, 2, 3], 
            }
        );
        const configInstance = Configuration.getConfig(true);
        expect(configInstance.getObject('object')).toStrictEqual({ key: 'value' });
        expect(configInstance.getObject('no_object', {a: 'b'})).toStrictEqual({ a: 'b' });
        expect(configInstance.getObject('no_object', null)).toBe(null);
        expect(configInstance.getObject('string_object')).toBe(null);
        expect(configInstance.getObject('empty_object')).toBe(null);
        expect(configInstance.getObject('number')).toBe(null);
        expect(configInstance.getObject('array')).toBe(null);
        expect(configInstance.getObject('string')).toBe(null);
    });
    it('getArray will return only arrays', () => {
        createConfigFile(
            Configuration.getConfigFilePath('test'),
            { 
                object: { key: 'value' },
                empty_object: {},
                string: 'string',
                string_object : new String('foo'),
                number: 100,
                array: [1, 2, 3],
                empty_array: [], 
            }
        );
        const configInstance = Configuration.getConfig(true);
        expect(configInstance.getArray('array')).toStrictEqual([1, 2, 3]);
        expect(configInstance.getArray('empty_array')).toBe(null);
        expect(configInstance.getArray('no_array', [1, 2])).toStrictEqual([1, 2]);
        expect(configInstance.getArray('no_array', null)).toBe(null);
        expect(configInstance.getArray('string_object')).toBe(null);
        expect(configInstance.getArray('object')).toBe(null);
        expect(configInstance.getArray('empty_object')).toBe(null);
        expect(configInstance.getArray('number')).toBe(null);
        expect(configInstance.getArray('string')).toBe(null);
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
    } catch (error) {
        console.error(`Error deleting ${Configuration.configFileDir}:`, error);
    };
};

const removeTestConfigFiles = () => {
    try {
        fs.emptyDirSync(Configuration.configFileDir);
    } catch (error) {
        console.error('Error emptying directory:', error);
    }
    jest.resetModules();
};
