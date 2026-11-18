describe('#api-client/server entry guard', () => {
  afterEach(() => {
    // @ts-expect-error window is not declared on the server
    delete global.window;
  });

  it('should refuse to load the browser stub', async () => {
    await jest.isolateModulesAsync(async () => {
      await expect(import('../server.browser.js')).rejects.toThrow(
        '#api-client/server is server-only'
      );
    });
  });

  it('should refuse to load the server entry where a window exists', async () => {
    // @ts-expect-error a bare object stands in for the browser global
    global.window = {};

    await jest.isolateModulesAsync(async () => {
      await expect(import('../server.js')).rejects.toThrow('#api-client/server is server-only');
    });
  });

  it('should load the server entry on the server', async () => {
    await jest.isolateModulesAsync(async () => {
      const entry = await import('../server.js');

      expect(entry.createServerApiClient).toBeInstanceOf(Function);
    });
  });
});
