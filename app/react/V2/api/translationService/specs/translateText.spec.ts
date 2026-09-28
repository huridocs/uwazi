/**
 * @jest-environment node
 */
import { apiClient } from '#V2/api/client.js';
import { ApiError } from '#shared/apiClient/index.js';
import { probeTranslationService, translateText } from '../index.js';

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

    expect(apiClient.postJson).toHaveBeenCalledWith(
      'translationService',
      {
        text: 'Hearing',
        language_from: 'en',
        language_to: 'es',
      },
      { policies: { notification: false } }
    );
    expect(text).toBe('Audiencia');
    expect(error).toBeUndefined();
  });

  it('treats a missing translated_text as failure', async () => {
    jest.mocked(apiClient.postJson).mockResolvedValue([{}]);
    const [text, error] = await translateText({
      text: 'Hearing',
      language_from: 'en',
      language_to: 'es',
    });
    expect(text).toBeUndefined();
    expect(error).toBeUndefined();
  });
});

describe('probeTranslationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when the service translates', async () => {
    jest.mocked(apiClient.postJson).mockResolvedValue([{ translated_text: 'ok' }]);
    await expect(probeTranslationService('en', 'es')).resolves.toBe(true);
  });

  it('returns false when the request fails', async () => {
    jest
      .mocked(apiClient.postJson)
      .mockResolvedValue([undefined, new ApiError('unavailable', { kind: 'http', status: 400 })]);
    await expect(probeTranslationService('en', 'es')).resolves.toBe(false);
  });
});
