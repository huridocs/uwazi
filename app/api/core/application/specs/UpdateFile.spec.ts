import { ProcessedPDF } from '#api/core/domain/files/ProcessedPDF.js';
import { EntityPermissionChecker } from '#api/core/domain/entityAccessPolicy/EntityPermissionChecker.js';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import { Result } from '#api/core/libs/Result.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
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
    }),
    f.file('attach2', {
      type: 'attachment',
      entity: 'entity1',
      originalname: 'file.pdf',
      mimetype: 'application/pdf',
    }),
    f.file('attach3', {
      type: 'attachment',
      entity: 'entity1',
      originalname: 'unchanged.pdf',
      mimetype: 'application/pdf',
    }),
    f.file('attach4', {
      type: 'attachment',
      entity: 'entity1',
      originalname: 'protected.pdf',
      mimetype: 'application/pdf',
    }),
    ...f.processedDocument('doc1', {
      entity: 'entity1',
      language: 'en',
      mimetype: 'application/pdf',
    }),
    ...f.processedDocument('doc2', {
      entity: 'entity1',
      language: 'en',
      mimetype: 'application/pdf',
    }),
    ...f.processedDocument('doc3', {
      entity: 'entity1',
      language: 'en',
      mimetype: 'application/pdf',
    }),
  ],
};

const createSut = (deps?: Partial<UpdateFileDeps>) => {
  const entityPermissions = TestUtils.mockClass<EntityPermissionChecker>({
    checkWritePermission: jest.fn().mockResolvedValue(Result.ok(true)),
  });

  return testingEnvironment.runWithContext(() => ({
    sut: UpdateFileUseCaseFactory.default({ entityPermissions, ...deps }),
  }));
};

const getDbFile = async (id: string) => {
  const files = await testingEnvironment.db.getAllFrom('files');
  return files.find((file: any) => file._id.toString() === f.idString(id))!;
};

describe('UpdateFile', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

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
      const result = await createSut().sut.execute({
        fileId: f.idString('attach1'),
        originalname: 'renamed.pdf',
      });

      expect(result.originalname).toBe('renamed.pdf');
      expect((await getDbFile('attach1')).originalname).toBe('renamed.pdf');
    });

    it('ignores language updates', async () => {
      const result = await createSut().sut.execute({
        fileId: f.idString('attach2'),
        language: 'es',
      });

      expect(result.originalname).toBe('file.pdf');
      expect((result as any).language).toBeUndefined();
    });

    it('returns unchanged state on an empty update', async () => {
      const result = await createSut().sut.execute({ fileId: f.idString('attach3') });

      expect(result.originalname).toBe('unchanged.pdf');
      expect((await getDbFile('attach3')).originalname).toBe('unchanged.pdf');
    });
  });

  describe('ProcessedPDF', () => {
    it('renames originalname', async () => {
      const result = await createSut().sut.execute({
        fileId: f.idString('doc1'),
        originalname: 'renamed.pdf',
      });

      expect(result.originalname).toBe('renamed.pdf');
      expect((await getDbFile('doc1')).originalname).toBe('renamed.pdf');
    });

    it('updates language', async () => {
      const result = await createSut().sut.execute({ fileId: f.idString('doc2'), language: 'es' });

      expect((result as ProcessedPDF).language).toBe('es');
      expect((await getDbFile('doc2')).language).toBe('spa');
    });

    it('updates both originalname and language', async () => {
      const result = await createSut().sut.execute({
        fileId: f.idString('doc3'),
        originalname: 'both.pdf',
        language: 'es',
      });

      expect(result.originalname).toBe('both.pdf');
      expect((result as ProcessedPDF).language).toBe('es');
      expect((await getDbFile('doc3')).originalname).toBe('both.pdf');
      expect((await getDbFile('doc3')).language).toBe('spa');
    });
  });
});
