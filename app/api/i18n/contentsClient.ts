export class GithubQuotaExceeded extends Error {
  constructor() {
    super();
    this.name = 'GithubQuotaExceeded';
  }
}

export class ContentsClient {
  private readonly GITHUB_API_URL = 'https://api.github.com/repos/huridocs/uwazi-contents/contents';

  private readonly headers = { accept: 'application/vnd.github.v4.raw' };

  async retrievePredefinedTranslations(locale: string) {
    const url = `${this.GITHUB_API_URL}/ui-translations/${locale}.csv`;
    const response = await fetch(url, { headers: this.headers });

    if (response.status === 403) throw new GithubQuotaExceeded();

    return (await response.text()) || '';
  }
}
