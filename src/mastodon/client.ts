import Mastodon from 'mastodon-api';
import { format, resolve } from 'url';
import { Config } from '../config';


function getMastodonClient() {
    const host = Config.get('mastodon_server');
    const accessToken = Config.get('mastodon_access_token');
}


export class MozSocialClient {
    private client: Mastodon;
    private static readonly apiPath: string = '/api/v1/';

    constructor(host:string, accessToken:string) {
        const endpoint = resolve(host, MozSocialClient.apiPath);
        this.client = new Mastodon({
            access_token: accessToken,
            api_url: endpoint
        });
    }

    get endpoint(): string {
        return this.client.apiUrl;
    }
} 