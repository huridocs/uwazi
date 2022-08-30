import { EntityDeletedEvent } from 'api/entities/events/EntityDeletedEvent';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { applicationEventsBus } from 'api/eventsbus';
import { FileCreatedEvent } from 'api/files/events/FileCreatedEvent';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import { search } from 'api/search';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { FileType } from 'shared/types/fileType';
import { registerEventListeners } from '../eventListeners';
import { Suggestions } from '../suggestions';

const fixturesFactory = getFixturesFactory();

const notExtractedTemplateName = 'not_extracted_template';
const extractedTemplateName = 'extracted_template';

beforeAll(() => {
  registerEventListeners(applicationEventsBus);
});

beforeEach(async () => {
  spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
  await db.setupFixturesAndContext({
    templates: [
      fixturesFactory.template(notExtractedTemplateName, [
        fixturesFactory.property('some_property', propertyTypes.text),
      ]),
      fixturesFactory.template(extractedTemplateName, [
        fixturesFactory.property('not_extracted_property_1', propertyTypes.text),
        fixturesFactory.property('not_extracted_property_2', propertyTypes.numeric),
        fixturesFactory.property('extracted_property_1', propertyTypes.text),
        fixturesFactory.property('extracted_property_2', propertyTypes.numeric),
      ]),
    ],
    entities: [
      fixturesFactory.entity('ent', extractedTemplateName, {}, { sharedId: 'entity for new file' }),
      fixturesFactory.entity(
        'ent2',
        notExtractedTemplateName,
        {},
        { sharedId: 'entity with template not in config' }
      ),
    ],
    settings: [
      {
        _id: db.id(),
        languages: [{ key: 'en', default: true, label: 'English' }],
        features: {
          metadataExtraction: {
            url: 'service-url',
            templates: [
              {
                template: fixturesFactory.id(extractedTemplateName).toString(),
                properties: ['extracted_property_1', 'extracted_property_2', 'title'],
              },
            ],
          },
        },
      },
    ],
  });
});

afterAll(async () => {
  await db.disconnect();
});

describe(`On ${EntityUpdatedEvent.name}`, () => {
  let updateSpy: jest.SpyInstance;
  const extractedBefore = {
    _id: db.id(),
    sharedId: 'sid',
    title: 'title',
    template: fixturesFactory.id(extractedTemplateName),
    metadata: {
      not_extracted_property_1: [{ value: 'text' }],
      not_extracted_property_2: [{ value: 0 }],
      extracted_property_1: [{ value: 'text' }],
      extracted_property_2: [{ value: 0 }],
    },
    language: 'en',
  };

  beforeAll(async () => {
    updateSpy = jest.spyOn(Suggestions, 'updateStates');
  });

  beforeEach(() => {
    updateSpy.mockClear();
  });

  afterAll(() => {
    updateSpy.mockRestore();
  });

  it.each([
    {
      before: {
        _id: db.id(),
        sharedId: 'sid',
        title: 'title',
        template: fixturesFactory.id(notExtractedTemplateName),
        metadata: { some_property: [{ value: 'text' }] },
        language: 'en',
      },
      afterMetadata: { some_property: [{ value: 'other_text' }] },
      called: false,
      message: 'should not update suggestions, if template is not set up',
    },
    {
      before: extractedBefore,
      afterMetadata: extractedBefore.metadata,
      called: false,
      message: 'should not update suggestions, if no metadata changed',
    },
    {
      before: extractedBefore,
      afterMetadata: {
        ...extractedBefore.metadata,
        not_extracted_property_1: [{ value: 'new text' }],
        not_extracted_property_2: [{ value: 1 }],
      },
      called: false,
      message: 'should not update suggestions, if no relevant metadata changed',
    },
    {
      before: extractedBefore,
      afterMetadata: {
        ...extractedBefore.metadata,
        extracted_property_1: [{ value: 'new text' }],
      },
      called: true,
      message: 'should update suggestions, if only relevant metadata changed',
    },
    {
      before: extractedBefore,
      afterMetadata: {
        not_extracted_property_1: [{ value: 'new text' }],
        not_extracted_property_2: [{ value: 1 }],
        extracted_property_1: [{ value: 'new text' }],
        extracted_property_2: [{ value: 1 }],
      },
      called: true,
      message: 'should update suggestions, if relevant metadata is also changed',
    },
  ])('$message', async ({ before, afterMetadata, called }) => {
    const after = {
      ...before,
      metadata: afterMetadata,
    };
    await applicationEventsBus.emit(
      new EntityUpdatedEvent({ before: [before], after: [after], targetLanguageKey: 'en' })
    );
    if (called) {
      expect(updateSpy).toHaveBeenCalled();
    } else {
      expect(updateSpy).not.toHaveBeenCalled();
    }
  });

  it('should update suggestions, if title is configured and changed', async () => {
    const after = {
      ...extractedBefore,
      title: 'new title',
    };
    await applicationEventsBus.emit(
      new EntityUpdatedEvent({ before: [extractedBefore], after: [after], targetLanguageKey: 'en' })
    );
    expect(updateSpy).toHaveBeenCalled();
  });
});

describe(`On ${EntityDeletedEvent.name}`, () => {
  it('should delete all suggestions related to entities that triggered the event', async () => {
    const deleteSpy = jest.spyOn(Suggestions, 'deleteByEntityId');

    const doc1Id = db.id();
    const doc2Id = db.id();

    await applicationEventsBus.emit(
      new EntityDeletedEvent({
        entity: [
          {
            _id: doc1Id,
            sharedId: 'shared',
          },
          {
            _id: doc2Id,
            sharedId: 'shared',
          },
        ],
      })
    );

    expect(deleteSpy).toHaveBeenCalledWith('shared');
    deleteSpy.mockRestore();
  });
});

describe(`On ${FileCreatedEvent.name}`, () => {
  it('should create blank suggestions, if the new file is an entity document', async () => {
    const saveSpy = jest.spyOn(Suggestions, 'saveMultiple');

    const fileInfo = fixturesFactory.file(
      'new file',
      'entity for new file',
      'document',
      'new_file.pdf'
    );

    await applicationEventsBus.emit(
      new FileCreatedEvent({
        newFile: fileInfo,
      })
    );

    expect(saveSpy).toHaveBeenCalledWith([
      {
        date: expect.any(Number),
        entityId: 'entity for new file',
        error: '',
        fileId: fixturesFactory.id('new file'),
        language: 'en',
        propertyName: 'extracted_property_1',
        segment: '',
        status: 'ready',
        suggestedValue: '',
      },
      {
        date: expect.any(Number),
        entityId: 'entity for new file',
        error: '',
        fileId: fixturesFactory.id('new file'),
        language: 'en',
        propertyName: 'extracted_property_2',
        segment: '',
        status: 'ready',
        suggestedValue: '',
      },
      {
        date: expect.any(Number),
        entityId: 'entity for new file',
        error: '',
        fileId: fixturesFactory.id('new file'),
        language: 'en',
        propertyName: 'title',
        segment: '',
        status: 'ready',
        suggestedValue: '',
      },
    ]);

    saveSpy.mockRestore();
  });

  it('should not fail on not configured templates', async () => {
    const saveSpy = jest.spyOn(Suggestions, 'saveMultiple');

    const fileInfo = fixturesFactory.file(
      'new file',
      'entity with template not in config',
      'document',
      'new_file.pdf'
    );

    await applicationEventsBus.emit(
      new FileCreatedEvent({
        newFile: fileInfo,
      })
    );

    expect(saveSpy).not.toHaveBeenCalled();

    saveSpy.mockRestore();
  });
});

describe(`On ${FileUpdatedEvent.name}`, () => {
  const fileId = db.id();

  const extractedMetadata = {
    extractedMetadata: [
      {
        name: 'propertyName',
        selection: {
          text: 'something',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ],
  };

  const original: FileType = {
    _id: fileId,
    creationDate: 1,
    entity: 'sharedId1',
    generatedToc: true,
    originalname: 'upload1',
    type: 'custom',
    language: 'eng',
  };

  it('should not update the ix suggestion state if the extractedMetadata does not change', async () => {
    const updateSpy = jest.spyOn(Suggestions, 'updateStates');

    await applicationEventsBus.emit(new FileUpdatedEvent({ before: original, after: original }));

    expect(updateSpy).not.toHaveBeenCalled();

    updateSpy.mockClear();

    await applicationEventsBus.emit(
      new FileUpdatedEvent({
        before: { ...original, ...extractedMetadata },
        after: { ...original, ...extractedMetadata },
      })
    );

    expect(updateSpy).not.toHaveBeenCalled();
    updateSpy.mockRestore();
  });

  it('should update ix suggestions if extractedMetada changes', async () => {
    const updateSpy = jest.spyOn(Suggestions, 'updateStates');

    await applicationEventsBus.emit(
      new FileUpdatedEvent({ before: original, after: { ...original, ...extractedMetadata } })
    );

    expect(updateSpy).toHaveBeenCalledWith({ fileId });

    updateSpy.mockClear();

    await applicationEventsBus.emit(
      new FileUpdatedEvent({
        before: { ...original, ...extractedMetadata },
        after: {
          ...original,
          extractedMetadata: [
            { ...extractedMetadata.extractedMetadata[0], name: 'other something' },
          ],
        },
      })
    );

    expect(updateSpy).toHaveBeenCalledWith({ fileId });

    updateSpy.mockClear();

    await applicationEventsBus.emit(
      new FileUpdatedEvent({
        before: { ...original, ...extractedMetadata },
        after: {
          ...original,
          extractedMetadata: [],
        },
      })
    );

    expect(updateSpy).toHaveBeenCalledWith({ fileId });
    updateSpy.mockRestore();
  });
});

describe(`On ${FilesDeletedEvent.name}`, () => {
  it('should delete all suggestions related to files that triggered the event', async () => {
    const deleteSpy = jest.spyOn(Suggestions, 'delete');

    const file1Id = db.id();
    const file2Id = db.id();

    await applicationEventsBus.emit(
      new FilesDeletedEvent({
        files: [
          {
            _id: file1Id,
            creationDate: 1,
            entity: 'sharedId1',
            generatedToc: true,
            originalname: 'upload1',
            type: 'document',
            language: 'eng',
          },
          {
            _id: file2Id,
            creationDate: 1,
            entity: 'sharedId2',
            generatedToc: true,
            originalname: 'upload2',
            type: 'document',
            language: 'eng',
          },
        ],
      })
    );

    expect(deleteSpy).toHaveBeenCalledWith({ fileId: { $in: [file1Id, file2Id] } });
    deleteSpy.mockRestore();
  });
});
