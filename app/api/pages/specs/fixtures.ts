import db, { DBFixture } from '#api/utils/testing_db.js';

export const pageToUpdate = db.id();

const emptyDraft = { content: '', script: '', css: '' };

export const fixtures: DBFixture = {
  pages: [
    {
      _id: db.id(),
      sharedId: '1',
      entityView: true,
      creationDate: 1,
      locales: {
        es: { title: 'Batman finishes', draft: emptyDraft },
        en: { title: 'Batman finishes', draft: emptyDraft },
      },
    },
    {
      _id: pageToUpdate,
      sharedId: '2',
      creationDate: 1,
      locales: {
        es: { title: 'Penguin almost done', draft: emptyDraft },
        fr: { title: 'Right there', draft: emptyDraft },
      },
    },
    {
      _id: db.id(),
      sharedId: '3',
      entityView: false,
      locales: {
        es: { title: 'Pagina que sera entityView', draft: emptyDraft },
        en: {
          title: 'Page that will be for entityView',
          draft: emptyDraft,
        },
      },
    },
  ],

  settings: [
    {
      _id: db.id(),
      languages: [
        { key: 'es', label: 'ES', default: true },
        { key: 'pt', label: 'PT' },
        { key: 'en', label: 'EN' },
      ],
    },
  ],
  templates: [
    {
      _id: db.id(),
      title: 'Template with custom page 1',
      entityViewPage: '1',
    },
    {
      _id: db.id(),
      title: 'Template with custom page 2',
      entityViewPage: '1',
    },
  ],
};
