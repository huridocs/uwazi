import { SuperAgentHttpClient } from './SuperAgentHttpClient.js';

export class HttpClientFactory {
  static createDefault() {
    return new SuperAgentHttpClient();
  }
}
