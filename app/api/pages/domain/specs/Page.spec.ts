import { Page, normalizeSlug, slugFromTitle } from '../Page.js';
import {
  CannotRemoveLastLocaleError,
  InvalidPageReleaseError,
  PageLocaleNotFoundError,
} from '../errors.js';

const baseLocale = (title: string, content: string) => ({
  title,
  slug: title.toLowerCase().replace(/\s+/g, '-'),
  draft: { content, script: '', css: '' },
});

const bilingualPage = () =>
  new Page({
    id: '507f1f77bcf86cd799439011',
    sharedId: 'shared1',
    creationDate: 1000,
    userId: '507f1f77bcf86cd799439012',
    entityView: false,
    markdownSupport: true,
    locales: {
      en: baseLocale('Home', '<p>en</p>'),
      es: baseLocale('Inicio', '<p>es</p>'),
    },
  });

describe('Page', () => {
  describe('normalizeSlug', () => {
    it('should never return an empty slug', () => {
      expect(normalizeSlug('', 'Hello')).toBe('hello');
      expect(normalizeSlug('   ', 'World')).toBe('world');
      expect(normalizeSlug(undefined, '')).toBe('page');
    });

    it('should normalize user-provided slug', () => {
      expect(normalizeSlug('My Custom Slug', 'Title')).toBe('my-custom-slug');
    });
  });

  describe('updateLocale slug', () => {
    it('should keep explicit slug when title changes if slug is sent', () => {
      const page = bilingualPage();
      page.updateLocale('en', { title: 'New Title', slug: 'custom-slug' });
      expect(page.getLocale('en').slug).toBe('custom-slug');
    });

    it('should allow the same slug on different locales of one page', () => {
      const page = bilingualPage();
      page.updateLocale('en', { slug: 'shared-slug' });
      page.updateLocale('es', { slug: 'shared-slug' });
      expect(page.getLocale('en').slug).toBe('shared-slug');
      expect(page.getLocale('es').slug).toBe('shared-slug');
    });
  });


  it('should add a locale by cloning source', () => {
    const p = new Page({
      id: '507f1f77bcf86cd799439011',
      sharedId: 's2',
      creationDate: 1,
      userId: 'u',
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
      userId: 'u',
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
    expect(release.locales.en.draft.content).toBe('<p>en</p>');
    expect(release.locales.es.draft.content).toBe('<p>es</p>');
  });

  it('should reject publish without message or content', () => {
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

    const empty = new Page({
      id: '507f1f77bcf86cd799439011',
      sharedId: 's4',
      creationDate: 1,
      userId: 'u',
      entityView: false,
      markdownSupport: true,
      locales: { en: baseLocale('T', '   ') },
    });
    expect(() =>
      empty.buildRelease({
        releaseMessage: 'msg',
        actorId: 'a',
        date: 1,
        languageKeys: ['en'],
        nextVersion: 1,
      })
    ).toThrow(InvalidPageReleaseError);
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
      userId: 'u',
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
