/**
 * @jest-environment node
 */
import backend from 'fetch-mock';
import { APIURL } from '#app/config.js';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  redirect: jest.fn(),
}));

jest.mock('#app/Notifications/actions/notificationsActions.js', () => ({
  notify: jest.fn(),
}));

jest.mock('#app/store.js', () => ({
  store: { dispatch: jest.fn() },
}));

jest.mock('#app/App/LoadingProgressBar.js', () => ({
  loadingProgressBar: {
    start: jest.fn(),
    done: jest.fn(),
  },
}));

jest.mock('#app/I18N/index.js', () => ({
  t: jest.fn((_context, key) => key),
}));

describe('api on SSR', () => {
  beforeEach(() => {
    jest.resetModules();
    backend.restore();
  });

  afterEach(() => {
    backend.restore();
    jest.clearAllMocks();
  });

  it('should add ssr=true to GET requests during SSR', async () => {
    backend.get(`${APIURL}test_get?key=value&ssr=true`, JSON.stringify({ method: 'GET' }));

    const [{ api }, { RequestParams }] = await Promise.all([
      import('#app/utils/api.js'),
      import('#app/utils/RequestParams.js'),
    ]);

    const response = await api.get('test_get', new RequestParams({ key: 'value' }));

    expect(response.json.method).toBe('GET');
    expect(backend.called(`${APIURL}test_get?key=value&ssr=true`)).toBe(true);
  });
});
