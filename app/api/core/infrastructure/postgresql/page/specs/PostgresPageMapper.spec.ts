import { Page, PageReleaseSnapshot } from '#api/pages.v2/domain/Page.js';
import { PostgresPageMapper } from '../PostgresPageMapper.js';

const buildPage = () =>
  new Page({
    id: 'page-1',
    sharedId: 'shared-1',
    creationDate: 1700000000,
    entityView: true,
    markdownSupport: true,
    locales: {
      en: { title: 'Title EN', draft: { content: '<p>EN</p>', script: 'en.js', css: 'en.css' } },
      es: { title: 'Title ES', draft: { content: '<p>ES</p>', script: '', css: '' } },
    },
  });

const buildSnapshot = (): PageReleaseSnapshot => ({
  version: 3,
  releaseMessage: 'a release',
  userId: 'user-1',
  date: 1700000001,
  locales: {
    en: { title: 'Title EN', draft: { content: '<p>EN</p>', script: 'en.js', css: 'en.css' } },
    es: { title: 'Title ES', draft: { content: '<p>ES</p>', script: '', css: '' } },
  },
});

describe('PostgresPageMapper', () => {
  describe('pages', () => {
    it('should map the flat page fields to a row', () => {
      const row = PostgresPageMapper.toRow(buildPage());

      expect(row).toEqual({
        _id: 'page-1',
        shared_id: 'shared-1',
        creation_date: 1700000000,
        entity_view: true,
        markdown_support: true,
      });
    });

    it('should fan the locales out into one row per language', () => {
      const rows = PostgresPageMapper.toLocaleRows(buildPage());

      expect(rows).toEqual([
        {
          page_id: 'page-1',
          language: 'en',
          title: 'Title EN',
          draft_content: '<p>EN</p>',
          draft_script: 'en.js',
          draft_css: 'en.css',
        },
        {
          page_id: 'page-1',
          language: 'es',
          title: 'Title ES',
          draft_content: '<p>ES</p>',
          draft_script: '',
          draft_css: '',
        },
      ]);
    });

    it('should round-trip a multi locale page', () => {
      const page = buildPage();

      const roundTripped = PostgresPageMapper.toDomain(
        PostgresPageMapper.toRow(page),
        PostgresPageMapper.toLocaleRows(page)
      );

      expect(roundTripped.id).toBe(page.id);
      expect(roundTripped.sharedId).toBe(page.sharedId);
      expect(roundTripped.creationDate).toBe(page.creationDate);
      expect(roundTripped.entityView).toBe(true);
      expect(roundTripped.markdownSupport).toBe(true);
      expect(roundTripped.getLocales()).toEqual(page.getLocales());
    });

    it('should default a missing creation date to now', () => {
      jest.spyOn(Date, 'now').mockReturnValue(12345);

      const page = PostgresPageMapper.toDomain(
        { _id: 'page-1', shared_id: 'shared-1', entity_view: false, markdown_support: false },
        []
      );

      expect(page.creationDate).toBe(12345);
      expect(page.getLocales()).toEqual({});
    });
  });

  describe('page releases', () => {
    it('should map a snapshot to a row keeping the locales whole', () => {
      const row = PostgresPageMapper.releaseSnapshotToRow('page-1', 'release-1', buildSnapshot());

      expect(row).toEqual({
        _id: 'release-1',
        page_id: 'page-1',
        version: 3,
        release_message: 'a release',
        user_id: 'user-1',
        date: 1700000001,
        locales: {
          en: {
            title: 'Title EN',
            draft: { content: '<p>EN</p>', script: 'en.js', css: 'en.css' },
          },
          es: { title: 'Title ES', draft: { content: '<p>ES</p>', script: '', css: '' } },
        },
      });
    });

    it('should round-trip a release snapshot', () => {
      const snapshot = buildSnapshot();

      const roundTripped = PostgresPageMapper.rowToReleaseSnapshot(
        PostgresPageMapper.releaseSnapshotToRow('page-1', 'release-1', snapshot)
      );

      expect(roundTripped).toEqual(snapshot);
    });

    it('should read a release with no user as an empty user id', () => {
      const roundTripped = PostgresPageMapper.rowToReleaseSnapshot({
        _id: 'release-1',
        page_id: 'page-1',
        version: 1,
        release_message: 'no user',
        date: 1700000001,
        locales: {},
      });

      expect(roundTripped.userId).toBe('');
      expect(roundTripped.locales).toEqual({});
    });
  });
});
