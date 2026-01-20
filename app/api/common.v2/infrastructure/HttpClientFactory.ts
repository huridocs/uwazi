import { SuperAgentHttpClient } from '#api/common.v2/infrastructure/SuperAgentHttpClient.js';

export class HttpClientFactory {
  static createDefault() {
    return new SuperAgentHttpClient();
  }
}
