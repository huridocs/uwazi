import type { TranslateInput, TranslateOutput } from './TranslationServiceContracts.js';

interface TranslationService {
  translate(input: TranslateInput): Promise<TranslateOutput>;
}

export type { TranslationService };
