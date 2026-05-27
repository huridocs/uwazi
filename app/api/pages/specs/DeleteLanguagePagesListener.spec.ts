import db, { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import pages from '../index.js';
import { DeleteLanguagePagesListener } from '../DeleteLanguagePagesListener.js';

const userId = db.id();

const fixtures: DBFixture = {
  users: [{ _id: userId, username: 'user1', email: 'user1@test.com', role: 'admin' }],
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  pages: [
    {
      _id: db.id(),
      sharedId: 'page1',
      creationDate: 1000,
      locales: {
        en: {
          title: 'Test page',
          draft: { content: '', script: '', css: '' },
        },
        es: {
          title: 'Página de prueba',
          draft: { content: '', script: '', css: '' },
        },
      },
    },
  ],
};

const heartbeat = jest.fn();

const createSUT = () =>
  testingEnvironment.runWithContext(() => new DeleteLanguagePagesListener({}));

const dispatch = async (listener: DeleteLanguagePagesListener, language: string): Promise<void> => {
  await testingEnvironment.runWithContext(async () => {
    await listener.handleDispatch(heartbeat, {
      tenantName: 'localhost',
      userId: userId.toString(),
      language,
    } as any);
  });
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('DeleteLanguagePagesListener', () => {
  it('should remove locale for the deleted language', async () => {
    const listener = await createSUT();
    await dispatch(listener, 'es');

    await expect(
      testingEnvironment.runWithContext(async () => pages.getById('page1', 'es'))
    ).rejects.toMatchObject({ code: 404 });
    const enPage = await testingEnvironment.runWithContext(async () =>
      pages.getById('page1', 'en')
    );
    expect(enPage.title).toBe('Test page');
  });

  it('should keep the page document', async () => {
    const listener = await createSUT();
    await dispatch(listener, 'es');

    const enPages = await testingEnvironment.runWithContext(async () =>
      pages.get({ language: 'en' })
    );
    expect(enPages).toHaveLength(1);
    expect(enPages[0].sharedId).toBe('page1');
  });
});
