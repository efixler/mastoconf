import { MozSocialClient }  from './client';

describe('MozSocialClient constructor', () => {
    it('sets up the endpoint correctly', () => {   
        const client = new MozSocialClient('https://mozilla.social', '2Nx-rH6IifCkE1rNloCan916f-1abT-TkoCTpDc7qi4');
        expect(client.endpoint).toBe('https://mozilla.social/api/v1/');
    });
});