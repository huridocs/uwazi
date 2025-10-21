import entities from 'api/entities';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { EntityDeletedEvent } from 'api/entities/events/EntityDeletedEvent';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { FileCreatedEvent } from 'api/files/events/FileCreatedEvent';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import { search } from 'api/search';
import { TemplateDeletedEvent } from 'api/core/domain/template/events/TemplateDeletedEvent';
import { TemplateUpdatedEvent } from 'api/core/domain/template/events/TemplateUpdatedEvent';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db, { DBFixture, testingDB } from 'api/utils/testing_db';
import { propertyTypes } from 'shared/propertyTypes';
import { FileType } from 'shared/types/fileType';
import { UserRole } from 'shared/types/userSchema';
import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { registerEventListeners } from '../eventListeners';
import { Suggestions } from '../suggestions';

const fixturesFactory = getFixturesFactory();

const notExtractedTemplateName = 'not_extracted_template';
const extractedTemplateName = 'extracted_template';
const otherExtractedTemplateName = 'other_extracted_template';

const adminUser = {
  username: 'admin',
  role: UserRole.ADMIN,
  email: 'user@test.com',
};

const fixtures: DBFixture = {
  templates: [
    fixturesFactory.template(notExtractedTemplateName, [
      fixturesFactory.property('some_property', propertyTypes.text),
    ]),
    fixturesFactory.template(extractedTemplateName, [
      fixturesFactory.property('not_extracted_property_1', propertyTypes.text),
      fixturesFactory.property('not_extracted_property_2', propertyTypes.numeric),
      fixturesFactory.property('extracted_property_1', propertyTypes.text),
      fixturesFactory.property('extracted_property_2', propertyTypes.numeric),
      fixturesFactory.property('select_property', propertyTypes.select),
      fixturesFactory.property('multiselect_property', propertyTypes.multiselect),
      fixturesFactory.property('relationship_property', propertyTypes.relationship),
    ]),
    fixturesFactory.template(otherExtractedTemplateName, [
      fixturesFactory.property('extracted_property_1', propertyTypes.text),
      fixturesFactory.property('extracted_property_2_1', propertyTypes.text),
      fixturesFactory.property('extracted_property_2_2', propertyTypes.numeric),
    ]),
    fixturesFactory.template('extractor_source_text_target_text_template', [
      fixturesFactory.property('target_text', propertyTypes.text),
      fixturesFactory.property('source_text', propertyTypes.text),
    ]),
    fixturesFactory.template('extractor_source_text_target_text_template_1', [
      fixturesFactory.property('target_text', propertyTypes.text),
      fixturesFactory.property('source_text', propertyTypes.text),
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
    fixturesFactory.entity(
      'extractor_source_text_target_text_entity',
      'extractor_source_text_target_text_template'
    ),
    fixturesFactory.entity(
      'extractor_source_text_target_text_entity_1',
      'extractor_source_text_target_text_template_1'
    ),
  ],
  files: [
    fixturesFactory.fileDeprecated('entfile', 'entity for new file', 'document', 'entfile.pdf'),
    fixturesFactory.fileDeprecated(
      'entfile2',
      'entity with template not in config',
      'document',
      'entfile2.pdf'
    ),
  ],
  settings: [
    {
      _id: db.id(),
      languages: [
        { key: 'en', default: true, label: 'English' },
        { key: 'pt', label: 'Portuguese' },
      ],
      features: {
        metadataExtraction: {
          url: 'service-url',
        },
      },
    },
  ],
  ixextractors: [
    fixturesFactory.ixExtractor('title_extractor', 'title', [
      extractedTemplateName,
      otherExtractedTemplateName,
    ]),
    fixturesFactory.ixExtractor('extractor1', 'extracted_property_1', [
      extractedTemplateName,
      otherExtractedTemplateName,
    ]),
    fixturesFactory.ixExtractor('extractor2', 'extracted_property_2', [extractedTemplateName]),
    fixturesFactory.ixExtractor('extractor3', 'some_property', ['some_other_template']),
    fixturesFactory.ixExtractor('extractor4', 'extracted_property_2_1', [
      otherExtractedTemplateName,
    ]),
    fixturesFactory.ixExtractor('extractor5', 'extracted_property_2_2', [
      otherExtractedTemplateName,
    ]),
    fixturesFactory.ixExtractor('extractor6', 'select_property', [extractedTemplateName]),
    fixturesFactory.ixExtractor('extractor7', 'multiselect_property', [extractedTemplateName]),
    fixturesFactory.ixExtractor('extractor8', 'relationship_property', [extractedTemplateName]),
    fixturesFactory.ixExtractor(
      'extractor_source_text_target_text',
      'target_text',
      ['extractor_source_text_target_text_template'],
      { property: 'source_text' }
    ),
    fixturesFactory.ixExtractor(
      'extractor_source_text_target_text_2',
      'target_text',
      ['extractor_source_text_target_text_template'],
      { property: 'source_text' }
    ),
    fixturesFactory.ixExtractor('extractor_source_pdf_target_text', 'target_text', [
      'extractor_source_text_target_text_template',
    ]),
    fixturesFactory.ixExtractor(
      'extractor_source_pdf_target_text_1',
      'target_text',
      ['extractor_source_text_target_text_template_1'],
      { property: 'source_text' }
    ),
  ],
  ixsuggestions: [
    fixturesFactory.ixSuggestion_deprecated(
      'new_prop_1_suggestion',
      'extractor1',
      'entity for new file',
      extractedTemplateName,
      'entfile',
      'extracted_property_1'
    ),
    fixturesFactory.ixSuggestion_deprecated(
      'new_prop_2_suggestion',
      'extractor2',
      'entity for new file',
      extractedTemplateName,
      'entfile',
      'extracted_property_2'
    ),
    fixturesFactory.ixSuggestion_deprecated(
      'new_title_suggestion',
      'title_extractor',
      'entity for new file',
      extractedTemplateName,
      'entfile',
      'title'
    ),
    fixturesFactory.ixSuggestion_deprecated(
      'new_select_suggestion',
      'extractor6',
      'entity for new file',
      extractedTemplateName,
      'entfile',
      'select_property'
    ),
    fixturesFactory.ixSuggestion_deprecated(
      'new_multiselect_suggestion',
      'extractor7',
      'entity for new file',
      extractedTemplateName,
      'entfile',
      'multiselect_property'
    ),
    fixturesFactory.ixSuggestion_deprecated(
      'new_relationship_suggestion',
      'extractor8',
      'entity for new file',
      extractedTemplateName,
      'entfile',
      'relationship_property'
    ),
  ],
};

const disableFeatures = async () =>
  testingDB.mongodb?.collection('settings').updateOne({}, { $set: { features: {} } });

beforeAll(() => {
  registerEventListeners(applicationEventsBus);
});

beforeEach(async () => {
  jest.spyOn(search, 'indexEntities').mockReturnValue(Promise.resolve());
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe(`On ${EntityUpdatedEvent.name}`, () => {
  let updateSpy: jest.SpyInstance;

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
      case: 'should not update suggestions if template is not changed',
      sharedId: 'entity for new file',
      newTemplate: fixturesFactory.id(extractedTemplateName),
      expectedSuggestions: [
        {
          entityId: 'entity for new file',
          entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
          propertyName: 'extracted_property_1',
          fileId: fixturesFactory.id('entfile'),
        },
        {
          entityId: 'entity for new file',
          entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
          propertyName: 'extracted_property_2',
          fileId: fixturesFactory.id('entfile'),
        },
        {
          entityId: 'entity for new file',
          entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
          propertyName: 'multiselect_property',
          fileId: fixturesFactory.id('entfile'),
        },
        {
          entityId: 'entity for new file',
          entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
          propertyName: 'relationship_property',
          fileId: fixturesFactory.id('entfile'),
        },
        {
          entityId: 'entity for new file',
          entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
          propertyName: 'select_property',
          fileId: fixturesFactory.id('entfile'),
        },
        {
          entityId: 'entity for new file',
          entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
          propertyName: 'title',
          fileId: fixturesFactory.id('entfile'),
        },
      ],
    },
    {
      case: 'should update suggestions if template is changed from configured to not configured',
      sharedId: 'entity for new file',
      newTemplate: fixturesFactory.id(notExtractedTemplateName),
      expectedSuggestions: [],
    },
  ])('$case', async ({ sharedId, newTemplate, expectedSuggestions }) => {
    const current = await entities.getById(sharedId, 'en');
    const toSave = { ...current, template: newTemplate };
    await entities.save(toSave, { user: adminUser, language: 'en' });
    const allSuggestions =
      (await db.mongodb
        ?.collection('ixsuggestions')
        .find({}, { sort: { propertyName: 1 } })
        .toArray()) || [];
    expect(allSuggestions).toHaveLength(expectedSuggestions.length);
    expect(allSuggestions).toMatchObject(expectedSuggestions);
  });
});

describe(`On ${EntityDeletedEvent.name}`, () => {
  it.each([
    {
      message: 'should not act if the feature is not enabled',
      featureEnabled: false,
    },
    {
      message: 'should delete all suggestions related to entities that triggered the event',
      featureEnabled: true,
      calledWith: 'shared',
    },
  ])('$message', async ({ featureEnabled, calledWith }) => {
    if (!featureEnabled) {
      await disableFeatures();
    }

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

    if (calledWith) {
      expect(deleteSpy).toHaveBeenCalledWith(calledWith);
    } else {
      expect(deleteSpy).not.toHaveBeenCalled();
    }
    deleteSpy.mockRestore();
  });
});

describe(`On ${FileCreatedEvent.name}`, () => {
  it('should not act if the feature is not enabled', async () => {
    await disableFeatures();

    const saveSpy = jest.spyOn(Suggestions, 'saveMultiple');

    const fileInfo = fixturesFactory.fileDeprecated(
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

    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('should only create suggestions if Extractors extracts from pdf', async () => {
    const saveSpy = jest.spyOn(Suggestions, 'saveMultiple');

    const fileInfo = fixturesFactory.fileDeprecated(
      'new file',
      'extractor_source_text_target_text_entity_1',
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

  it('should not fail on not configured templates', async () => {
    const saveSpy = jest.spyOn(Suggestions, 'saveMultiple');

    const fileInfo = fixturesFactory.fileDeprecated(
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

describe('On EntityCreatedEvent', () => {
  it('should only create suggestions if Extractors extracts from text', async () => {
    const saveSpy = jest.spyOn(Suggestions, 'saveMultiple');

    await applicationEventsBus.emit(
      new EntityCreatedEvent({
        targetLanguageKey: 'en',
        entities: [
          {
            title: 'any_title',
            sharedId: 'any_shared_id_1',
            template: fixturesFactory.id('extractor_source_text_target_text_template'),
            metadata: {
              target_text: [{ value: 'target_text_value' }],
            },
            language: 'en',
          },
          {
            title: 'any_title',
            sharedId: 'any_shared_id_1',
            template: fixturesFactory.id('extractor_source_text_target_text_template'),
            metadata: {
              target_text: [{ value: 'target_text_value' }],
            },
            language: 'pt',
          },
        ],
      })
    );

    expect(saveSpy.mock.calls[0][0]).toEqual([
      {
        language: 'en',
        entityId: 'any_shared_id_1',
        entityTemplate: fixturesFactory.id('extractor_source_text_target_text_template').toString(),
        extractorId: fixturesFactory.id('extractor_source_text_target_text'),
        propertyName: 'target_text',
        status: 'ready',
        error: '',
        segment: '',
        suggestedValue: '',
        date: null,
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
        currentValue: 'target_text_value',
        entityTitle: 'any_title',
        trainingSample: false,
        suggestedText: '',
      },
      {
        language: 'pt',
        entityId: 'any_shared_id_1',
        entityTemplate: fixturesFactory.id('extractor_source_text_target_text_template').toString(),
        extractorId: fixturesFactory.id('extractor_source_text_target_text'),
        propertyName: 'target_text',
        status: 'ready',
        error: '',
        segment: '',
        suggestedValue: '',
        date: null,
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
        currentValue: 'target_text_value',
        entityTitle: 'any_title',
        trainingSample: false,
        suggestedText: '',
      },

      {
        language: 'en',
        entityId: 'any_shared_id_1',
        entityTemplate: fixturesFactory.id('extractor_source_text_target_text_template').toString(),
        extractorId: fixturesFactory.id('extractor_source_text_target_text_2'),
        propertyName: 'target_text',
        status: 'ready',
        error: '',
        segment: '',
        suggestedValue: '',
        date: null,
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
        currentValue: 'target_text_value',
        entityTitle: 'any_title',
        trainingSample: false,
        suggestedText: '',
      },
      {
        language: 'pt',
        entityId: 'any_shared_id_1',
        entityTemplate: fixturesFactory.id('extractor_source_text_target_text_template').toString(),
        extractorId: fixturesFactory.id('extractor_source_text_target_text_2'),
        propertyName: 'target_text',
        status: 'ready',
        error: '',
        segment: '',
        suggestedValue: '',
        date: null,
        state: {
          labeled: true,
          withValue: true,
          withSuggestion: false,
          match: false,
          hasContext: false,
          obsolete: false,
          processing: false,
          error: false,
        },
        currentValue: 'target_text_value',
        entityTitle: 'any_title',
        trainingSample: false,
        suggestedText: '',
      },
    ]);

    saveSpy.mockRestore();
  });

  it('should not create Suggestions if there are no Extractors', async () => {
    const saveSpy = jest.spyOn(Suggestions, 'saveMultiple');
    await applicationEventsBus.emit(
      new EntityCreatedEvent({
        targetLanguageKey: 'en',
        entities: [
          {
            template: fixturesFactory.id('template_without_extractors'),
          },
          {
            template: fixturesFactory.id('template_without_extractors'),
          },
        ],
      })
    );

    expect(saveSpy).not.toHaveBeenCalled();
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

  it('should not act if the feature is not enabled', async () => {
    await disableFeatures();
    const updateSpy = jest.spyOn(Suggestions, 'updateStates');

    await applicationEventsBus.emit(
      new FileUpdatedEvent({ before: original, after: { ...original, ...extractedMetadata } })
    );

    expect(updateSpy).not.toHaveBeenCalled();
  });
});

describe(`On ${FilesDeletedEvent.name}`, () => {
  it.each([
    {
      message: 'should delete all suggestions related to files that triggered the event',
      enabled: true,
    },
    {
      message: 'should not act if the feature is not enabled',
      enabled: false,
    },
  ])('$message', async ({ enabled }) => {
    if (!enabled) {
      await disableFeatures();
    }
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

    if (enabled) {
      expect(deleteSpy).toHaveBeenCalledWith({ fileId: { $in: [file1Id, file2Id] } });
    } else {
      expect(deleteSpy).not.toHaveBeenCalled();
    }

    deleteSpy.mockRestore();
  });
});

describe(`On ${TemplateUpdatedEvent.name}`, () => {
  it('should not act if the feature is not enabled', async () => {
    await disableFeatures();

    const extractors = await testingDB.mongodb?.collection('ixextractors').find({}).toArray();
    const suggestions = await testingDB.mongodb?.collection('ixsuggestions').find({}).toArray();

    await applicationEventsBus.emit(
      new TemplateUpdatedEvent({
        before: {
          _id: fixturesFactory.id(extractedTemplateName),
          name: extractedTemplateName,
          properties: [
            fixturesFactory.property('not_extracted_property_1', propertyTypes.text),
            fixturesFactory.property('not_extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('extracted_property_1', propertyTypes.text),
            fixturesFactory.property('extracted_property_2', propertyTypes.numeric),
          ],
        },
        after: {
          _id: fixturesFactory.id(extractedTemplateName),
          name: extractedTemplateName,
          properties: [
            fixturesFactory.property('not_extracted_property_1', propertyTypes.text),
            fixturesFactory.property('not_extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('extracted_property_1', propertyTypes.text),
          ],
        },
      })
    );

    expect(extractors).toEqual(
      await testingDB.mongodb?.collection('ixextractors').find({}).toArray()
    );
    expect(suggestions).toEqual(
      await testingDB.mongodb?.collection('ixsuggestions').find({}).toArray()
    );
  });

  it('should delete the template from the extractor if the property not longer exists', async () => {
    await applicationEventsBus.emit(
      new TemplateUpdatedEvent({
        before: {
          _id: fixturesFactory.id(extractedTemplateName),
          name: extractedTemplateName,
          properties: [
            fixturesFactory.property('not_extracted_property_1', propertyTypes.text),
            fixturesFactory.property('not_extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('extracted_property_1', propertyTypes.text),
            fixturesFactory.property('extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('select_property', propertyTypes.select),
            fixturesFactory.property('multiselect_property', propertyTypes.multiselect),
            fixturesFactory.property('relationship_property', propertyTypes.relationship),
          ],
        },
        after: {
          _id: fixturesFactory.id(extractedTemplateName),
          name: extractedTemplateName,
          properties: [
            fixturesFactory.property('not_extracted_property_1', propertyTypes.text),
            fixturesFactory.property('not_extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('extracted_property_1', propertyTypes.text),
            fixturesFactory.property('select_property', propertyTypes.select),
            fixturesFactory.property('multiselect_property', propertyTypes.multiselect),
          ],
        },
      })
    );

    const extractors = await testingDB.mongodb
      ?.collection('ixextractors')
      .find({
        templates: {
          $in: [
            fixturesFactory.id(otherExtractedTemplateName),
            fixturesFactory.id(extractedTemplateName),
            fixturesFactory.id('some_other_template'),
          ],
        },
      })
      .toArray();

    expect(extractors).toMatchObject([
      fixturesFactory.ixExtractor('title_extractor', 'title', [
        extractedTemplateName,
        otherExtractedTemplateName,
      ]),
      fixturesFactory.ixExtractor('extractor1', 'extracted_property_1', [
        extractedTemplateName,
        otherExtractedTemplateName,
      ]),
      fixturesFactory.ixExtractor('extractor3', 'some_property', ['some_other_template']),
      fixturesFactory.ixExtractor('extractor4', 'extracted_property_2_1', [
        otherExtractedTemplateName,
      ]),
      fixturesFactory.ixExtractor('extractor5', 'extracted_property_2_2', [
        otherExtractedTemplateName,
      ]),
      fixturesFactory.ixExtractor('extractor6', 'select_property', [extractedTemplateName]),
      fixturesFactory.ixExtractor('extractor7', 'multiselect_property', [extractedTemplateName]),
    ]);

    const suggestions = await testingDB.mongodb?.collection('ixsuggestions').find({}).toArray();

    expect(suggestions).toMatchObject([
      {
        entityId: 'entity for new file',
        entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
        propertyName: 'extracted_property_1',
        extractorId: fixturesFactory.id('extractor1'),
      },
      {
        entityId: 'entity for new file',
        entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
        propertyName: 'title',
        extractorId: fixturesFactory.id('title_extractor'),
      },
      {
        entityId: 'entity for new file',
        entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
        propertyName: 'select_property',
        extractorId: fixturesFactory.id('extractor6'),
      },
      {
        entityId: 'entity for new file',
        entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
        propertyName: 'multiselect_property',
        extractorId: fixturesFactory.id('extractor7'),
      },
    ]);
  });

  it('should remove the template from the extractor if the property changed names', async () => {
    await applicationEventsBus.emit(
      new TemplateUpdatedEvent({
        before: {
          _id: fixturesFactory.id(extractedTemplateName),
          name: extractedTemplateName,
          properties: [
            fixturesFactory.property('not_extracted_property_1', propertyTypes.text),
            fixturesFactory.property('not_extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('extracted_property_1', propertyTypes.text),
            fixturesFactory.property('extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('select_property', propertyTypes.select),
            fixturesFactory.property('multiselect_property', propertyTypes.multiselect),
            fixturesFactory.property('relationship_property', propertyTypes.relationship),
          ],
        },
        after: {
          _id: fixturesFactory.id(extractedTemplateName),
          name: extractedTemplateName,
          properties: [
            fixturesFactory.property('not_extracted_property_1', propertyTypes.text),
            fixturesFactory.property('not_extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('extracted_property_1', propertyTypes.text),
            fixturesFactory.property('extracted_property_2_renamed', propertyTypes.numeric),
            fixturesFactory.property('select_property', propertyTypes.select),
            fixturesFactory.property('multiselect_property_renamed', propertyTypes.multiselect),
            fixturesFactory.property('relationship_property', propertyTypes.relationship),
          ],
        },
      })
    );

    const extractors = await testingDB.mongodb
      ?.collection('ixextractors')
      .find({
        templates: {
          $in: [
            fixturesFactory.id(otherExtractedTemplateName),
            fixturesFactory.id(extractedTemplateName),
            fixturesFactory.id('some_other_template'),
          ],
        },
      })
      .toArray();

    expect(extractors).toMatchObject([
      fixturesFactory.ixExtractor('title_extractor', 'title', [
        extractedTemplateName,
        otherExtractedTemplateName,
      ]),
      fixturesFactory.ixExtractor('extractor1', 'extracted_property_1', [
        extractedTemplateName,
        otherExtractedTemplateName,
      ]),
      fixturesFactory.ixExtractor('extractor3', 'some_property', ['some_other_template']),
      fixturesFactory.ixExtractor('extractor4', 'extracted_property_2_1', [
        otherExtractedTemplateName,
      ]),
      fixturesFactory.ixExtractor('extractor5', 'extracted_property_2_2', [
        otherExtractedTemplateName,
      ]),
      fixturesFactory.ixExtractor('extractor6', 'select_property', [extractedTemplateName]),
      fixturesFactory.ixExtractor('extractor8', 'relationship_property', [extractedTemplateName]),
    ]);

    const suggestions = await testingDB.mongodb?.collection('ixsuggestions').find({}).toArray();

    expect(suggestions).toMatchObject([
      {
        entityId: 'entity for new file',
        entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
        propertyName: 'extracted_property_1',
        extractorId: fixturesFactory.id('extractor1'),
      },
      {
        entityId: 'entity for new file',
        entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
        propertyName: 'title',
        extractorId: fixturesFactory.id('title_extractor'),
      },
      {
        entityId: 'entity for new file',
        entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
        propertyName: 'select_property',
        extractorId: fixturesFactory.id('extractor6'),
      },
      {
        entityId: 'entity for new file',
        entityTemplate: fixturesFactory.id(extractedTemplateName).toString(),
        propertyName: 'relationship_property',
        extractorId: fixturesFactory.id('extractor8'),
      },
    ]);
  });

  it('should delete the extractor itself if it does not contain any templates', async () => {
    await applicationEventsBus.emit(
      new TemplateUpdatedEvent({
        before: {
          _id: fixturesFactory.id(extractedTemplateName),
          name: extractedTemplateName,
          properties: [
            fixturesFactory.property('not_extracted_property_1', propertyTypes.text),
            fixturesFactory.property('not_extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('extracted_property_1', propertyTypes.text),
            fixturesFactory.property('extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('select_property', propertyTypes.select),
            fixturesFactory.property('multiselect_property', propertyTypes.multiselect),
            fixturesFactory.property('relationship_property', propertyTypes.relationship),
          ],
        },
        after: {
          _id: fixturesFactory.id(extractedTemplateName),
          name: extractedTemplateName,
          properties: [
            fixturesFactory.property('not_extracted_property_1', propertyTypes.text),
            fixturesFactory.property('not_extracted_property_2', propertyTypes.numeric),
            fixturesFactory.property('extracted_property_1', propertyTypes.text),
            fixturesFactory.property('extracted_property_2_renamed', propertyTypes.numeric),
            fixturesFactory.property('select_property', propertyTypes.select),
            fixturesFactory.property('multiselect_property_renamed', propertyTypes.multiselect),
            fixturesFactory.property('relationship_property', propertyTypes.relationship),
          ],
        },
      })
    );

    const extractorsWithoutTemplates = await testingDB.mongodb
      ?.collection('ixextractors')
      .countDocuments({ templates: { $size: 0 } });

    expect(extractorsWithoutTemplates).toEqual(0);
  });
});

describe(`On ${TemplateDeletedEvent.name}`, () => {
  it('should delete the template from the extractor if the property not longer exists', async () => {
    await applicationEventsBus.emit(
      new TemplateDeletedEvent({
        templateId: fixturesFactory.id(extractedTemplateName).toString(),
      })
    );

    const extractors = await testingDB.mongodb
      ?.collection('ixextractors')
      .find({
        templates: {
          $in: [
            fixturesFactory.id(otherExtractedTemplateName),
            fixturesFactory.id('some_other_template'),
          ],
        },
      })
      .toArray();

    expect(extractors).toEqual([
      fixturesFactory.ixExtractor('title_extractor', 'title', [otherExtractedTemplateName]),
      fixturesFactory.ixExtractor('extractor1', 'extracted_property_1', [
        otherExtractedTemplateName,
      ]),
      fixturesFactory.ixExtractor('extractor3', 'some_property', ['some_other_template']),
      fixturesFactory.ixExtractor('extractor4', 'extracted_property_2_1', [
        otherExtractedTemplateName,
      ]),
      fixturesFactory.ixExtractor('extractor5', 'extracted_property_2_2', [
        otherExtractedTemplateName,
      ]),
    ]);
  });

  it('should delete the extractor itself if it does not contain any templates', async () => {
    await applicationEventsBus.emit(
      new TemplateDeletedEvent({
        templateId: fixturesFactory.id(extractedTemplateName).toString(),
      })
    );

    const extractorsWithoutTemplates = await testingDB.mongodb
      ?.collection('ixextractors')
      .countDocuments({ templates: { $size: 0 } });

    expect(extractorsWithoutTemplates).toEqual(0);
  });

  it('should delete the suggestions related to the template', async () => {
    await applicationEventsBus.emit(
      new TemplateDeletedEvent({
        templateId: fixturesFactory.id(extractedTemplateName).toString(),
      })
    );

    const suggestions = await testingDB.mongodb?.collection('ixsuggestions').find({}).toArray();

    expect(suggestions).toEqual([]);
  });

  it('should not act if the feature is not enabld', async () => {
    await disableFeatures();

    const suggestions = await testingDB.mongodb?.collection('ixsuggestions').find({}).toArray();
    const extractors = await testingDB.mongodb?.collection('ixextractors').find({}).toArray();

    await applicationEventsBus.emit(
      new TemplateDeletedEvent({
        templateId: fixturesFactory.id(extractedTemplateName).toString(),
      })
    );

    expect(suggestions).toEqual(
      await testingDB.mongodb?.collection('ixsuggestions').find({}).toArray()
    );
    expect(extractors).toEqual(
      await testingDB.mongodb?.collection('ixextractors').find({}).toArray()
    );
  });
});
