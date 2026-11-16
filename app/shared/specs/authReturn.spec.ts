import {
  consumeReturnPath,
  loginRedirect,
  loginUrl,
  rememberReturnPath,
  safeReturnPath,
  type ReturnStorage,
} from '#shared/authReturn.js';

const memoryStorage = (): ReturnStorage & { dump: () => string | null } => {
  let value: string | null = null;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    removeItem: () => {
      value = null;
    },
    dump: () => value,
  };
};

describe('safeReturnPath', () => {
  it('keeps a same-origin path with its search', () => {
    expect(safeReturnPath('/en/library/?q=some-search')).toBe('/en/library/?q=some-search');
  });

  it('decodes an encoded path once and keeps it internal', () => {
    expect(safeReturnPath('%2Fen%2Flibrary%2F%3Fq%3Dsome-search')).toBe(
      '/en/library/?q=some-search'
    );
  });

  it('rejects an external or protocol-relative target', () => {
    expect(safeReturnPath('https://evil.example/library')).toBeNull();
    expect(safeReturnPath('//evil.example/library')).toBeNull();
    expect(safeReturnPath('/\\evil.example')).toBeNull();
    expect(safeReturnPath('/%2F%2Fevil.example')).toBeNull();
  });

  it('rejects the login, set-password and unlock screens', () => {
    expect(safeReturnPath('/login')).toBeNull();
    expect(safeReturnPath('/en/login?redirect=%2F')).toBeNull();
    expect(safeReturnPath('/setpassword/abc')).toBeNull();
    expect(safeReturnPath('/unlockaccount/ada/code')).toBeNull();
  });

  it('treats the site root as no particular destination', () => {
    expect(safeReturnPath('/')).toBeNull();
    expect(safeReturnPath('')).toBeNull();
  });
});

describe('loginUrl', () => {
  it('puts a safe destination on the login query', () => {
    expect(loginUrl('/en/library/?q=some-search')).toBe(
      '/login?redirect=%2Fen%2Flibrary%2F%3Fq%3Dsome-search'
    );
  });

  it('sends an unsafe destination to the login screen alone', () => {
    expect(loginUrl('https://evil.example')).toBe('/login');
    expect(loginUrl(null)).toBe('/login');
  });
});

describe('loginRedirect', () => {
  it('keeps the destination only when login v2 is on', () => {
    expect(loginRedirect('/en/library/?q=some-search', { devflagloginv2: true })).toBe(
      '/login?redirect=%2Fen%2Flibrary%2F%3Fq%3Dsome-search'
    );
    expect(loginRedirect('/en/library/?q=some-search', { devflagloginv2: false })).toBe('/login');
    expect(loginRedirect('/en/library/?q=some-search', null)).toBe('/login');
  });
});

describe('rememberReturnPath', () => {
  it('keeps a destination for a later login and then forgets it', () => {
    const storage = memoryStorage();

    rememberReturnPath('/en/library/?q=some-search', [storage]);

    expect(consumeReturnPath([storage])).toBe('/en/library/?q=some-search');
    expect(consumeReturnPath([storage])).toBeNull();
  });

  it('drops a destination that has sat for more than a day', () => {
    const storage = memoryStorage();
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    rememberReturnPath('/en/library/?q=some-search', [storage]);
    jest.spyOn(Date, 'now').mockReturnValue(1_000 + 24 * 60 * 60 * 1000 + 1);

    expect(consumeReturnPath([storage])).toBeNull();

    jest.restoreAllMocks();
  });

  it('does not store an external target', () => {
    const storage = memoryStorage();

    rememberReturnPath('https://evil.example', [storage]);

    expect(storage.dump()).toBeNull();
  });
});
