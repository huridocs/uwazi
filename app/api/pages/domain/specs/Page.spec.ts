import { Page } from '../Page.js';
import {
  CannotRemoveLastLocaleError,
  InvalidPageReleaseError,
  PageLocaleNotFoundError,
} from '../errors.js';

const baseLocale = (title: string, content: string) => ({
  title,
  draft: { content, script: '', css: '' },
});

const bilingualPage = () =>
  new Page({
    id: '507f1f77bcf86cd799439011',
    sharedId: 'shared1',
    creationDate: 1000,
    entityView: false,
    markdownSupport: true,
    locales: {
      en: baseLocale('Home', '<p>en</p>'),
      es: baseLocale('Inicio', '<p>es</p>'),
    },
  });

describe('Page', () => {
  it('should add a locale by cloning source', () => {
    const p = new Page({
      id: '507f1f77bcf86cd799439011',
      sharedId: 's2',
      creationDate: 1,
      entityView: false,
      markdownSupport: true,
      locales: { en: baseLocale('Home', '<p>x</p>') },
    });
    p.addLocale('fr', 'en');
    expect(p.getLocale('fr').title).toBe('Home');
    expect(p.getLocale('fr').draft.content).toBe('<p>x</p>');
  });

  it('should remove a locale', () => {
    const page = bilingualPage();
    page.removeLocale('es');
    expect(() => page.getLocale('es')).toThrow(PageLocaleNotFoundError);
  });

  it('should not remove the last locale', () => {
    const single = new Page({
      id: '507f1f77bcf86cd799439011',
      sharedId: 's3',
      creationDate: 1,
      entityView: false,
      markdownSupport: true,
      locales: { en: baseLocale('Only', '') },
    });
    expect(() => single.removeLocale('en')).toThrow(CannotRemoveLastLocaleError);
  });

  it('should build a release snapshot for all language keys', () => {
    const page = bilingualPage();
    const release = page.buildRelease({
      releaseMessage: 'Ship it',
      actorId: 'actor1',
      date: 2000,
      languageKeys: ['en', 'es'],
      nextVersion: 2,
    });
    expect(release.version).toBe(2);
    expect(release.userId).toBe('actor1');
    expect(release.locales.en.draft.content).toBe('<p>en</p>');
    expect(release.locales.es.draft.content).toBe('<p>es</p>');
  });

  it('should reject publish without release message', () => {
    const page = bilingualPage();
    expect(() =>
      page.buildRelease({
        releaseMessage: '  ',
        actorId: 'a',
        date: 1,
        languageKeys: ['en'],
        nextVersion: 1,
      })
    ).toThrow(InvalidPageReleaseError);
  });

  it('should allow publish when all locale content is empty', () => {
    const empty = new Page({
      id: '507f1f77bcf86cd799439011',
      sharedId: 's4',
      creationDate: 1,
      entityView: false,
      markdownSupport: false,
      locales: { en: baseLocale('T', '   ') },
    });
    const release = empty.buildRelease({
      releaseMessage: 'msg',
      actorId: 'publisher1',
      date: 1,
      languageKeys: ['en'],
      nextVersion: 1,
    });
    expect(release.userId).toBe('publisher1');
    expect(release.locales.en.draft.content).toBe('   ');
  });

  it('should apply release to draft only for installed languages', () => {
    const page = bilingualPage();
    const release = page.buildRelease({
      releaseMessage: 'v1',
      actorId: 'a',
      date: 1,
      languageKeys: ['en', 'es'],
      nextVersion: 1,
    });
    const target = new Page({
      id: '507f1f77bcf86cd799439011',
      sharedId: 's5',
      creationDate: 1,
      entityView: false,
      markdownSupport: true,
      locales: {
        en: baseLocale('Old', 'old'),
      },
    });
    target.applyReleaseToDraft(release, ['en']);
    expect(target.getLocale('en').draft.content).toBe('<p>en</p>');
    expect(target.getLocaleKeys()).not.toContain('es');
  });
});
