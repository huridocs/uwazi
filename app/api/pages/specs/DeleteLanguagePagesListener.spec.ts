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
      language: 'en',
      title: 'Test page',
      user: userId,
    },
    {
      _id: db.id(),
      sharedId: 'page1',
      language: 'es',
      title: 'Test page (es)',
      user: userId,
    },
  ],
};

const heartbeat = jest.fn();

const createSUT = () =>
  testingEnvironment.runWithContext(() => new DeleteLanguagePagesListener({}));

const dispatch = async (listener: DeleteLanguagePagesListener, language: string): Promise<void> => {
  await listener.handleDispatch(heartbeat, {
    tenantName: 'localhost',
    userId: userId.toString(),
    language,
  } as any);
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('DeleteLanguagePagesListener', () => {
  it('should delete pages for the deleted language', async () => {
    const listener = await createSUT();
    await dispatch(listener, 'es');

    const esPages = await pages.get({ language: 'es' });
    expect(esPages).toHaveLength(0);
  });

  it('should leave pages for other languages intact', async () => {
    const listener = await createSUT();
    await dispatch(listener, 'es');

    const enPages = await pages.get({ language: 'en' });
    expect(enPages.length).toBeGreaterThan(0);
  });
});
