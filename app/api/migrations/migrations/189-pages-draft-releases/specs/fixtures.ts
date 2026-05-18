import db, { DBFixture } from '#api/utils/testing_db.js';

export const pageId = db.id();
export const userId = db.id();

export const fixtures: DBFixture = {
  pages: [
    {
      _id: pageId,
      sharedId: 'mig-page-1',
      language: 'en',
      title: 'Test',
      user: userId,
      creationDate: 1000,
      version: 2,
      metadata: {
        content: '<p>hi</p>',
        script: 'console.log(1)',
        css: 'body{}',
      },
    } as any,
  ],
};
