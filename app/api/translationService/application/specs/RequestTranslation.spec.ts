import { RequestTranslation } from '../RequestTranslation.js';
import type { TranslationService } from '../contracts/TranslationService.js';

describe('RequestTranslation', () => {
  it('should request a translation from the translation service', async () => {
    const translationService: TranslationService = {
      translate: jest.fn().mockResolvedValue({ translated_text: 'مرحبًا، كيف حالك؟' }),
    };

    const useCase = new RequestTranslation({ translationService });

    const result = await useCase.execute({
      text: 'hola que tal',
      language_from: 'es',
      language_to: 'ar',
    });

    expect(result).toEqual({ translated_text: 'مرحبًا، كيف حالك؟' });
    expect(translationService.translate).toHaveBeenCalledWith({
      text: 'hola que tal',
      language_from: 'es',
      language_to: 'ar',
    });
  });
});
