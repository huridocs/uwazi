import { LegacyPageService } from '../mongodb/LegacyPageService.js';

export class LegacyPageServiceFactory {
  static default() {
    return new LegacyPageService();
  }
}
