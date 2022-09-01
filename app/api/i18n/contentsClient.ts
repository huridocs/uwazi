import { config } from 'api/config';

export class GithubQuotaExceeded extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GithubQuotaExceeded';
  }
}

export class GithubAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GithubAuthenticationError';
  }
}

export class ContentsClient {
  private readonly GITHUB_API_URL = 'https://api.github.com/repos/huridocs/uwazi-contents/contents';

  private readonly headers = {
    accept: 'application/vnd.github.v4.raw',
    Authorization: `Bearer ${config.githubToken}`,
  };

  async retrievePredefinedTranslations(locale: string) {
    const url = `${this.GITHUB_API_URL}/ui-translations/${locale}.csv`;
    const response = await fetch(url, { headers: this.headers });
    if (response.status === 403) throw new GithubQuotaExceeded('Translations could not be loaded');
    if (response.status === 401) throw new GithubAuthenticationError('Github authentication failed');

    return (await response.text()) || '';
  }
}
