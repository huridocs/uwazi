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

export class GithubFileNotFound extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GithubFileNotFound';
  }
}

export class ContentsClient {
  private readonly GITHUB_API_URL = 'https://api.github.com/repos/huridocs/uwazi-contents/contents';

  private readonly baseHeaders = {
    accept: 'application/vnd.github.v4.raw',
  };

  async retrievePredefinedTranslations(locale: string) {
    const response = await this.fetch(`${this.GITHUB_API_URL}/ui-translations/${locale}.csv`);
    if (response.status === 404) throw new GithubFileNotFound(`${locale}.csv: File not found`);
    return (await response.text()) || '';
  }

  async retrieveAvailablePredefinedLanguages() {
    const response = await this.fetch(`${this.GITHUB_API_URL}/ui-translations/`);
    if (response.status === 404) throw new GithubFileNotFound('File not found');
    return ((await response.json()) as { name: string }[]).map(v => v.name.replace('.csv', ''));
  }

  private headers() {
    if (config.githubToken) {
      return { ...this.baseHeaders, Authorization: `Bearer ${config.githubToken}` };
    }

    return this.baseHeaders;
  }

  private async fetch(url: string) {
    const response = await fetch(url, { headers: this.headers() });
    if (response.status === 403) throw new GithubQuotaExceeded('Translations could not be loaded');
    if (response.status === 401) {
      throw new GithubAuthenticationError('Github authentication failed');
    }
    return response;
  }
}
