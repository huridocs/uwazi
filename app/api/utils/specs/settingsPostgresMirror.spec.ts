import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';

describe('settings postgresMirror', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should map mongo settings fixtures onto slice columns and extras', async () => {
    const id = new ObjectId();
    await testingEnvironment.setUp(
      {
        settings: [
          {
            _id: id,
            site_name: 'Mirrored',
            mailerConfig: 'smtp://x',
            dateFormat: 'YYYY',
          },
        ],
      },
      { postgres: true, postgresMirror: ['settings'] }
    );

    const rows = await testingPG.getAllFrom('settings');
    expect(rows).toHaveLength(1);
    expect(rows[0].site_name).toBe('Mirrored');
    expect(rows[0].mail).toEqual({ mailerConfig: 'smtp://x' });
    expect(rows[0].extras).toEqual({ dateFormat: 'YYYY' });
    expect(rows[0]).not.toHaveProperty('mailerConfig');
  });
});
