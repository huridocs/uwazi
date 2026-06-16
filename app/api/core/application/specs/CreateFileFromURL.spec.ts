/* eslint-disable max-statements */
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { CreateFileFromURLUseCaseFactory } from '#api/core/infrastructure/factories/CreateFileFromURLUseCaseFactory.js';

const fixtures: DBFixture = {};

const createSut = () =>
  testingEnvironment.runWithContext(() => ({
    sut: CreateFileFromURLUseCaseFactory.default(),
  }));

describe('CreateFileFromURL', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a URL attachment file with all provided fields', async () => {
    const { sut } = createSut();

    const result = await sut.execute({
      url: 'https://example.com/image.png',
      entityId: 'entity1',
      originalname: 'My Image',
    });

    expect(result.url).toBe('https://example.com/image.png');
    expect(result.entity).toBe('entity1');
    expect(result.originalname).toBe('My Image');
    expect(result.mimetype).toBe('image/png');
    expect(result.type).toBe('attachment');
    expect(result.id).toEqual(expect.any(String));
    await expect(result.filename).toMatch(/\.png$/);

    const files = await testingEnvironment.db.getAllFrom('files');
    const dbFile = files.find((file: any) => file.url === 'https://example.com/image.png')!;

    expect(dbFile).toBeDefined();
    expect(dbFile.originalname).toBe('My Image');
    expect(dbFile.entity).toBe('entity1');
    expect(dbFile.mimetype).toBe('image/png');
    await expect(dbFile.filename).toMatch(/\.png$/);
  });

  it('should use url as fallback originalname when not provided', async () => {
    const { sut } = createSut();

    const result = await sut.execute({
      url: 'https://example.com/document.pdf',
      entityId: 'entity1',
    });

    expect(result.originalname).toBe('https://example.com/document.pdf');
  });

  it('should resolve mimetype from the url extension', async () => {
    const { sut } = createSut();

    const pngResult = await sut.execute({
      url: 'https://example.com/image.png',
      entityId: 'entity',
      originalname: 'png file',
    });
    expect(pngResult.mimetype).toBe('image/png');

    const textResult = await sut.execute({
      url: 'https://example.com/file.txt',
      entityId: 'entity',
      originalname: 'text file',
    });
    expect(textResult.mimetype).toBe('text/plain');

    const htmlResult = await sut.execute({
      url: 'https://example.com/page',
      entityId: 'entity',
      originalname: 'html file',
    });
    expect(htmlResult.mimetype).toBe('text/html');
  });

  it('should fallback to text/html for non-accepted mime types like application/pdf', async () => {
    const { sut } = createSut();

    const result = await sut.execute({
      url: 'https://example.com/document.pdf',
      entityId: 'entity1',
      originalname: 'document',
    });

    expect(result.mimetype).toBe('text/html');
    await expect(result.filename).toMatch(/\.html$/);
  });

  it('should generate a safe filename', async () => {
    const { sut } = createSut();

    const result = await sut.execute({
      url: 'https://example.com/image.png',
      entityId: 'entity1',
      originalname: 'My Image',
    });

    expect(result.filename).not.toContain('/');
    expect(result.filename).not.toContain('..');
    expect(result.filename).not.toContain('\\');
    await expect(result.filename).toMatch(/^\d+[a-z0-9]+\.png$/);
  });

  it('should throw when entity is empty', async () => {
    const { sut } = createSut();

    await expect(
      sut.execute({
        url: 'https://example.com/file',
        entityId: '',
        originalname: 'file',
      })
    ).rejects.toThrow();
  });

  it('should throw when url is invalid', async () => {
    const { sut } = createSut();

    await expect(
      sut.execute({
        url: 'not-a-valid-url',
        entityId: 'entity1',
        originalname: 'file',
      })
    ).rejects.toThrow();
  });
});
