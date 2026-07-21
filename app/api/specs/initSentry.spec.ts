const mockInit = jest.fn();
const mockIsInitialized = jest.fn();

jest.mock('@sentry/node-core/light', () => ({
  ...jest.requireActual('@sentry/node-core/light'),
  init: (...args: unknown[]) => mockInit(...args),
  isInitialized: () => mockIsInitialized(),
}));

const configMock = {
  sentry: { dsn: '', tracesSampleRate: 0.1 },
  VERSION: '1.0.0',
  ENVIRONMENT: 'development',
};
jest.mock('#api/config.js', () => ({ config: configMock }));

describe('initSentry', () => {
  beforeEach(() => {
    jest.resetModules();
    mockInit.mockClear();
    mockIsInitialized.mockReturnValue(false);
    configMock.sentry.dsn = '';
  });

  it('calls Sentry.init when config.sentry.dsn is set and Sentry is not initialized', async () => {
    configMock.sentry.dsn = 'https://key@host/1';
    const { initSentry } = await import('../../initSentry.js');
    initSentry();
    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockInit.mock.calls[0][0]).toMatchObject({
      dsn: 'https://key@host/1',
      release: '1.0.0',
      environment: 'development',
      tracesSampleRate: 0.1,
    });
  });

  it('does not call Sentry.init when config.sentry.dsn is empty', async () => {
    const { initSentry } = await import('../../initSentry.js');
    initSentry();
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('does not call Sentry.init when Sentry is already initialized', async () => {
    mockIsInitialized.mockReturnValue(true);
    configMock.sentry.dsn = 'https://key@host/1';
    const { initSentry } = await import('../../initSentry.js');
    initSentry();
    expect(mockInit).not.toHaveBeenCalled();
  });
});
