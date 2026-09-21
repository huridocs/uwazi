/**
 * @jest-environment node
 */
import { apiClient } from '#V2/api/client.js';
import { translateText } from '../index.js';

jest.mock('#V2/api/client.js', () => ({
  apiClient: {
    postJson: jest.fn(),
  },
}));

describe('translateText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts to translationService and returns translated_text', async () => {
    jest.mocked(apiClient.postJson).mockResolvedValue([{ translated_text: 'Audiencia' }]);

    const [text, error] = await translateText({
      text: 'Hearing',
      language_from: 'en',
      language_to: 'es',
    });

    expect(apiClient.postJson).toHaveBeenCalledWith('translationService', {
      text: 'Hearing',
      language_from: 'en',
      language_to: 'es',
    });
    expect(text).toBe('Audiencia');
    expect(error).toBeUndefined();
  });
});
