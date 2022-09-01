import backend from 'fetch-mock';
import {
  ContentsClient,
  GithubAuthenticationError,
  GithubQuotaExceeded,
} from 'api/i18n/contentsClient';

describe('ContentsClient', () => {
  afterEach(() => {
    backend.restore();
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
