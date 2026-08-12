import { AvailableLanguagesQueryService } from '#api/core/application/translation/AvailableLanguagesQueryService.js';

export class AvailableLanguagesQueryServiceFactory {
  static default() {
    return AvailableLanguagesQueryService;
  }
}
