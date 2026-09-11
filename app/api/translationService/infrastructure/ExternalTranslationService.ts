import type { HttpClient } from '#api/common.v2/contracts/HttpClient.js';
import type { TranslationService } from '../application/contracts/TranslationService.js';
import type {
  TranslateInput,
  TranslateOutput,
} from '../application/contracts/TranslationServiceContracts.js';

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
    const translateUrl = new URL(
      this.dependencies.translatePath ?? '/translate',
      this.dependencies.url
    );
    translateUrl.searchParams.set('text', input.text);
    translateUrl.searchParams.set('language_from', input.language_from);
    translateUrl.searchParams.set('language_to', input.language_to);

    const body = await this.dependencies.httpClient.postJson<TranslateResponseDTO>({
      url: translateUrl.toString(),
      body: {},
      timeoutMs: TRANSLATION_TIMEOUT_MS,
    });

    if (typeof body?.translated_text !== 'string') {
      throw new Error('Translation service did not return translated_text');
    }

    return { translated_text: body.translated_text };
  }
}

export { ExternalTranslationService, TRANSLATION_TIMEOUT_MS };
