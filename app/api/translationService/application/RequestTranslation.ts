import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import type { TranslationService } from './contracts/TranslationService.js';
import type { TranslateInput, TranslateOutput } from './contracts/TranslationServiceContracts.js';

type Dependencies = {
  translationService: TranslationService;
};

class RequestTranslation extends AbstractUseCase<TranslateInput, TranslateOutput, Dependencies> {
  async execute(input: TranslateInput): Promise<TranslateOutput> {
    return this.deps.translationService.translate(input);
  }
}

export { RequestTranslation };
export type {
  TranslateInput as RequestTranslationInput,
  TranslateOutput as RequestTranslationOutput,
};
