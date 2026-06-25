import { EntityPermissionChecker } from '#api/core/domain/entityAccessPolicy/EntityPermissionChecker.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import { Result } from '#api/core/libs/Result.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { UpdateFileDeps } from '../UpdateFile.js';
import { UpdateFileUseCaseFactory } from '#api/core/infrastructure/factories/UpdateFileUseCaseFactory.js';

const f = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [{ languages: [{ default: true, key: 'en', label: 'English' }] }],
  templates: [f.template('template1')],
  files: [
    f.file('attach1', {
      type: 'attachment',
      entity: 'entity1',
      originalname: 'original.pdf',
      mimetype: 'application/pdf',
      creationDate: 0,
      size: 0,
    }),
    f.file('attach2', {
      type: 'attachment',
      entity: 'entity1',
      originalname: 'file.pdf',
      mimetype: 'application/pdf',
      creationDate: 0,
      size: 0,
    }),
    f.file('attach3', {
      type: 'attachment',
      entity: 'entity1',
      originalname: 'unchanged.pdf',
      mimetype: 'application/pdf',
      creationDate: 0,
      size: 0,
    }),
    f.file('attach4', {
      type: 'attachment',
      entity: 'entity1',
      originalname: 'protected.pdf',
      mimetype: 'application/pdf',
    }),
    f.file('attach5', {
      type: 'attachment',
      entity: 'entity1',
      originalname: 'url attachment',
      url: 'http://example.com/image.png',
      mimetype: 'image/png',
      creationDate: 0,
      size: 0,
    }),
    ...f.processedDocument('doc1', {
      entity: 'entity1',
      language: 'en',
      mimetype: 'application/pdf',
      creationDate: 0,
      size: 0,
      generatedToc: false,
      totalPages: 0,
    }),
    ...f.processedDocument('doc2', {
      entity: 'entity1',
      language: 'en',
      mimetype: 'application/pdf',
      creationDate: 0,
      size: 0,
      generatedToc: false,
      totalPages: 0,
    }),
    ...f.processedDocument('doc3', {
      entity: 'entity1',
      language: 'en',
      mimetype: 'application/pdf',
      creationDate: 0,
      size: 0,
      generatedToc: false,
      totalPages: 0,
    }),
  ],
};

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('UpdateFile', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({ featureFlags: { postgresFiles: usePostgres } });

      await testingEnvironment.setFixtures(fixtures);
    });

    const getDbFile = async (id: string) => {
      const files = await testingEnvironment.db.getAllFrom('files');
      return files.find((file: any) => file._id.toString() === f.idString(id))!;
    };

    const createSut = (deps?: Partial<UpdateFileDeps>) => {
      const entityPermissions = TestUtils.mockClass<EntityPermissionChecker>({
        checkWritePermission: jest.fn().mockResolvedValue(Result.ok(true)),
      });

      return testingEnvironment.runWithContext(() => ({
        sut: UpdateFileUseCaseFactory.default({ entityPermissions, ...deps }),
      }));
    };

    it('throws FileNotFound when the file does not exist', async () => {
      await expect(
        createSut().sut.execute({ fileId: f.idString('nonexistent') })
      ).rejects.toBeInstanceOf(FileNotFound);
    });

    it('throws a 404 error when the actor lacks write permission', async () => {
      const noPermissions = TestUtils.mockClass<EntityPermissionChecker>({
        checkWritePermission: jest.fn().mockResolvedValue(Result.ok(false)),
      });

      await expect(
        createSut({ entityPermissions: noPermissions }).sut.execute({
          fileId: f.idString('attach4'),
          originalname: 'hacked.pdf',
        })
      ).rejects.toMatchObject({ code: 404 });
    });

    describe('FileAttachment', () => {
      it('renames originalname', async () => {
        const fileBefore = await getDbFile('attach1');
        await createSut().sut.execute({
          fileId: f.idString('attach1'),
          originalname: 'renamed.pdf',
        });

        const result = await getDbFile('attach1');

        expect(result).toEqual({
          ...fileBefore,
          originalname: 'renamed.pdf',
        });
      });

      it('ignores language and toc updates', async () => {
        const fileBefore = await getDbFile('attach2');

        const toc = [
          {
            indentation: 0,
            label: 'Chapter 1',
            selectionRectangles: [
              {
                height: 100,
                width: 100,
                left: 0,
                top: 0,
              },
            ],
          },
        ];

        await createSut().sut.execute({
          fileId: f.idString('attach2'),
          language: 'es',
          toc,
        });

        const result = await getDbFile('attach2');

        expect(result).toEqual(fileBefore);
      });

      it('returns unchanged state on an empty update', async () => {
        const fileBefore = await getDbFile('attach3');

        await createSut().sut.execute({ fileId: f.idString('attach3') });
        const result = await getDbFile('attach3');

        expect(result).toEqual(fileBefore);
      });
    });

    describe('ProcessedPDF', () => {
      it('renames originalname', async () => {
        const fileBefore = await getDbFile('doc1');

        await createSut().sut.execute({
          fileId: f.idString('doc1'),
          originalname: 'renamed.pdf',
        });

        const result = await getDbFile('doc1');

        expect(result).toEqual({
          ...fileBefore,
          originalname: 'renamed.pdf',
        });
      });

      it('updates language', async () => {
        const fileBefore = await getDbFile('doc2');

        await createSut().sut.execute({ fileId: f.idString('doc2'), language: 'es' });

        const result = await getDbFile('doc2');

        expect(result).toEqual({
          ...fileBefore,
          language: 'spa',
        });
      });

      it('updates originalname, language and toc', async () => {
        const fileBefore = await getDbFile('doc3');

        const toc = [
          {
            indentation: 0,
            label: 'Chapter 1',
            selectionRectangles: [
              {
                height: 100,
                width: 100,
                left: 0,
                top: 0,
              },
            ],
          },
        ];

        await createSut().sut.execute({
          fileId: f.idString('doc3'),
          originalname: 'both.pdf',
          language: 'es',
          toc,
        });

        const result = await getDbFile('doc3');

        expect(result).toEqual({
          ...fileBefore,
          language: 'spa',
          originalname: 'both.pdf',
          toc,
        });
      });
    });

    describe('URLAttachment', () => {
      it('updated only mutable properties', async () => {
        const fileBefore = await getDbFile('attach5');
        await createSut().sut.execute({
          fileId: f.idString('attach5'),
          originalname: 'renamed url',
          url: 'http://image-changed.com/changed.png',
        });

        const result = await getDbFile('attach5');

        expect(result).toEqual({
          ...fileBefore,
          originalname: 'renamed url',
          url: 'http://image-changed.com/changed.png',
        });
      });

      it('ignores immutable properties', async () => {
        const fileBefore = await getDbFile('attach5');

        const toc = [
          {
            indentation: 0,
            label: 'Chapter 1',
            selectionRectangles: [
              {
                height: 100,
                width: 100,
                left: 0,
                top: 0,
              },
            ],
          },
        ];

        await createSut().sut.execute({
          fileId: f.idString('attach5'),
          language: 'es',
          toc,
          propertySelections: [],
        });

        const result = await getDbFile('attach5');

        expect(result).toEqual(fileBefore);
      });
    });
  });
});
