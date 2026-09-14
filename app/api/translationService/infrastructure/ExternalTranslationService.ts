import type { HttpClient } from '#api/common.v2/contracts/HttpClient.js';
import type { TranslationService } from '../application/contracts/TranslationService.js';
import type {
  TranslateInput,
  TranslateOutput,
} from '../application/contracts/TranslationServiceContracts.js';
import {
  InvalidTranslationResponseError,
  TranslationServiceRequestError,
} from '../domain/errors.js';

const TRANSLATION_TIMEOUT_MS = 60_000;

type Dependencies = {
  url: string;
  httpClient: HttpClient;
  translatePath?: string;
};

type TranslateResponseDTO = {
  translated_text?: string;
};

class ExternalTranslationService implements TranslationService {
  constructor(private dependencies: Dependencies) {}

  async translate(input: TranslateInput): Promise<TranslateOutput> {
    const body = await this.requestTranslation(this.buildTranslateUrl(input));

    if (typeof body?.translated_text !== 'string') {
      throw new InvalidTranslationResponseError();
    }

    return { translated_text: body.translated_text };
  }

  private buildTranslateUrl(input: TranslateInput): string {
    const translateUrl = new URL(
      this.dependencies.translatePath ?? '/translate',
      this.dependencies.url
    );
    translateUrl.searchParams.set('text', input.text);
    translateUrl.searchParams.set('language_from', input.language_from);
    translateUrl.searchParams.set('language_to', input.language_to);
    return translateUrl.toString();
  }

  private async requestTranslation(url: string): Promise<TranslateResponseDTO> {
    try {
      return await this.dependencies.httpClient.postJson<TranslateResponseDTO>({
        url,
        body: {},
        timeoutMs: TRANSLATION_TIMEOUT_MS,
      });
    } catch (error) {
      throw new TranslationServiceRequestError(error instanceof Error ? error : undefined);
    }
  }
}

export { ExternalTranslationService, TRANSLATION_TIMEOUT_MS };
