import { Configuration } from './loader';
import fs from 'fs-extra';
import path from 'path';

describe('It inits using the right environments and files', () => {
    let configFileDir: string = path.resolve('./_testconfigs');
    let oldConfigFileDir: string = Configuration.configFileDir;
    
    beforeAll(() => {
        Configuration.configFileDir = configFileDir;
        try {
            if (fs.existsSync(configFileDir)) return;
            fs.ensureDirSync(configFileDir);
        } catch (err) {
            throw (err);
        }
    });

    afterAll(async () => {
        Configuration.configFileDir = oldConfigFileDir;
        await fs.remove(configFileDir)
            .catch((error) => { 
                console.error(`Error deleting ${configFileDir}:`, error); 
            });
    });

    afterEach(async () => {
        jest.restoreAllMocks();
        process.env.NODE_ENV = 'test';
        // remove any test files
        await fs.emptyDir(configFileDir)
            .catch((error) => { console.error('Error emptying directory:', error); });
    });

    it('picks up the node environment correctly and falls back in test', () => {
        // Just making sure
        process.env.NODE_ENV = 'test';
        const factorySpy = jest.spyOn(Configuration, 'getConfig');
        const confFileSpy = jest.spyOn(Configuration, 'getConfigFilePath' as any);
        const configInstance = Configuration.getConfig(true);
        expect(factorySpy).toHaveBeenCalled();
        expect(confFileSpy).toHaveBeenCalledTimes(2);
        expect(confFileSpy).toHaveBeenLastCalledWith('development');
        expect(confFileSpy).toHaveBeenNthCalledWith(1, 'test');
        const configFilePath: string = confFileSpy.mock.results[0].value as string;
        expect(configFilePath.endsWith('/test.ts')).toBe(true);
    
        // const client = new MozSocialClient('https://mozilla.social', '2Nx-rH6IifCkE1rNloCan916f-1abT-TkoCTpDc7qi4');
        // expect(client.endpoint).toBe('https://mozilla.social/api/v1/');
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
            { TEST_KEY: 'test_value' }
        );
        createConfigFile(
            Configuration.getConfigFilePath('test'),
            { test_key: 'test_value' }
        );
        const factorySpy = jest.spyOn(Configuration, 'getConfig');
        const envFileSpy = jest.spyOn(Configuration, 'getEnvFilePath' as any);
        const confFileSpy = jest.spyOn(Configuration, 'getConfigFilePath' as any);
        const configInstance = Configuration.getConfig(true);
        expect(factorySpy).toHaveBeenCalled();
        expect(envFileSpy).toHaveBeenCalled();
        expect(confFileSpy).toHaveBeenLastCalledWith('test');
        expect(process.env.TEST_KEY).toBe('test_value');
    });
});

function createEnvFile(path: string, contents: Object): void {
    const envContent = Object.entries(contents)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    fs.outputFileSync(path, envContent);
}

function createConfigFile(path: string, contents: Object): void {
    const replacer = (key, value) => {
        
    }
    const configContent = `export default ${JSON.stringify(contents, null, 4)};`;
    fs.outputFileSync(path, configContent);
}