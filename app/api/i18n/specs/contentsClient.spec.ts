import backend from 'fetch-mock';
import {
  ContentsClient,
  GithubAuthenticationError,
  GithubQuotaExceeded,
} from 'api/i18n/contentsClient';
import { config } from 'api/config';

describe('ContentsClient', () => {
  afterEach(() => {
    backend.restore();
  });

  it('should call Github API with the Bearer token when configured', async () => {
    config.githubToken = 'fake_token';

    backend.get(
      (url, opts) =>
        url ===
          'https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations/es.csv' &&
        // @ts-ignore
        opts?.headers?.Authorization === 'Bearer fake_token' &&
        // @ts-ignore
        opts?.headers?.accept === 'application/vnd.github.v4.raw',
      { body: '' }
    );

    const client = new ContentsClient();

    await client.retrievePredefinedTranslations('es');
  });

  it('should call Github API without the Bearer token when not configured', async () => {
    config.githubToken = '';

    backend.get(
      (url, opts) =>
        url ===
          'https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations/es.csv' &&
        // @ts-ignore
        opts?.headers?.Authorization === undefined &&
        // @ts-ignore
        opts?.headers?.accept === 'application/vnd.github.v4.raw',
      { body: '' }
    );

    const client = new ContentsClient();

    await client.retrievePredefinedTranslations('es');
  });

  it('should throw error on Github quota exceeded', async () => {
    backend.get(
      'https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations/es.csv',
      { status: 403 }
    );
    const client = new ContentsClient();

    await expect(client.retrievePredefinedTranslations('es')).rejects.toThrowError(
      GithubQuotaExceeded
    );
  });

  it('should throw error on Github authentication error', async () => {
    backend.get(
      'https://api.github.com/repos/huridocs/uwazi-contents/contents/ui-translations/es.csv',
      { status: 401 }
    );

    const client = new ContentsClient();

    await expect(client.retrievePredefinedTranslations('es')).rejects.toThrowError(
      GithubAuthenticationError
    );
  });
});
