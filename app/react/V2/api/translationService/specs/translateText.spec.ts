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

  it('stays available when the probe only times out', async () => {
    jest
      .mocked(apiClient.postJson)
      .mockResolvedValue([undefined, new ApiError('Timed out', { kind: 'timeout', status: 0 })]);
    await expect(probeTranslationService('en', 'es')).resolves.toBe(true);
  });
});

type PendingPost = (value: [{ translated_text: string }, undefined]) => void;

const hangTranslations = () => {
  const pending: PendingPost[] = [];
  jest.mocked(apiClient.postJson).mockImplementation(
    () =>
      new Promise(resolve => {
        pending.push(resolve);
      })
  );
  return pending;
};

const startThree = () => {
  const input = { text: 'Hearing', language_from: 'en', language_to: 'es' };
  return [
    translateText(input),
    translateText({ ...input, language_to: 'fr' }),
    translateText({ ...input, language_to: 'ar' }),
  ];
};

const finish = (pending: PendingPost[], index: number) => {
  pending[index]?.([{ translated_text: 'ok' }, undefined]);
};

const queueThird = () => {
  const pending = hangTranslations();
  const input = { text: 'Hearing', language_from: 'en', language_to: 'es' };
  const running = [translateText(input), translateText({ ...input, language_to: 'fr' })];
  const controller = new AbortController();
  const queued = translateText({ ...input, language_to: 'ar' }, { signal: controller.signal });
  return { pending, running, controller, queued };
};

describe('translateText concurrency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('leaves a connection free while earlier translations are still running', async () => {
    const pending = hangTranslations();
    const requests = startThree();
    await Promise.resolve();
    expect(apiClient.postJson).toHaveBeenCalledTimes(2);
    finish(pending, 0);
    await requests[0];
    expect(apiClient.postJson).toHaveBeenCalledTimes(3);
    [1, 2].forEach(index => finish(pending, index));
    await Promise.all(requests.slice(1));
  });

  it('drops a queued translation when its signal aborts', async () => {
    const { pending, running, controller, queued } = queueThird();
    await Promise.resolve();
    expect(apiClient.postJson).toHaveBeenCalledTimes(2);
    controller.abort();
    const [, error] = await queued;
    expect(error?.kind).toBe('cancelled');
    expect(apiClient.postJson).toHaveBeenCalledTimes(2);
    [0, 1].forEach(index => finish(pending, index));
    await Promise.all(running);
  });
});
