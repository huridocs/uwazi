import { SuperAgentHttpClient } from './SuperAgentHttpClient';

export class HttpClientFactory {
  static createDefault() {
    return new SuperAgentHttpClient();
  }
}
