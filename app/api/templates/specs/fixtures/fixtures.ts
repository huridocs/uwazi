import db, { DBFixture } from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { propertyTypes } from 'shared/propertyTypes';
import { LanguagesListSchema, MetadataSchema } from 'shared/types/commonTypes';

const templateToBeEditedId = db.id();
const templateToBeDeleted = '589af97080fc0b23471d67f1';
const thesaurusTemplateId = db.id();
const thesaurusTemplate2Id = db.id();
const thesaurusTemplate3Id = db.id();
const templateWithContents = db.id();
const select3id = db.id();
const select4id = db.id();
const swapTemplate = db.id();
const relatedTo = db.id();
const templateToBeInherited = db.id();
const templateInheritingFromAnother = db.id();
const propertyToBeInherited = db.id();
const propertyToBeInherited2 = db.id();
const thesauriId1 = db.id();
const thesauriId2 = db.id();
const templateWithExtractedMetadata = db.id();
const propertyA = db.id();
const propertyB = db.id();
const propertyC = db.id();
const propertyD = db.id();
const pageSharedId = 'pageid';

const languages: LanguagesListSchema = [
  { key: 'en', label: 'English', default: true },
  { key: 'es', label: 'Spanish' },
  { key: 'pt', label: 'Portugal' },
];
const languageKeys = languages.map(l => l.key);

const createEntitiesInAllLanguages = (
  baseTitle: string,
  template: ObjectId,
  metadata: MetadataSchema
) =>
  languageKeys.map(lKey => ({
    metadata,
    template,
    title: `${baseTitle}_${lKey}`,
    language: lKey,
    sharedId: `${baseTitle}-sharedId`,
  }));

const fixtures: DBFixture = {
  templates: [
    {
      _id: templateToBeEditedId,
      name: 'template to be edited',
      properties: [],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      default: true,
    },
    {
      _id: db.id(templateToBeDeleted),
      name: 'to be deleted',
      properties: [],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    },
    {
      _id: db.id(),
      name: 'duplicated name',
      properties: [],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    },
    {
      _id: thesaurusTemplateId,
      name: 'thesauri template',
      properties: [
        {
          _id: db.id(),
          type: propertyTypes.select,
          content: thesauriId1.toString(),
          label: 'select',
          name: 'select',
        },
        {
          _id: db.id(),
          type: propertyTypes.relationship,
          content: templateToBeDeleted,
          label: 'relationshipToBeDeleted',
          name: 'relationshipToBeDeleted',
        },
      ],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    },
    {
      _id: thesaurusTemplate2Id,
      name: 'thesauri template 2',
      properties: [
        {
          _id: db.id(),
          type: propertyTypes.select,
          content: thesauriId1.toString(),
          label: 'select2',
          name: 'select2',
        },
        {
          _id: db.id(),
          type: propertyTypes.relationship,
          content: templateToBeDeleted,
          label: 'relationshipToBeDeleted',
          name: 'relationshipToBeDeleted',
        },
      ],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    },
    {
      _id: thesaurusTemplate3Id,
      name: 'thesauri template 3',
      properties: [
        { _id: db.id(), type: propertyTypes.text, label: 'text' },
        { _id: db.id(), type: propertyTypes.text, label: 'text2' },
        {
          _id: db.id(),
          type: propertyTypes.relationship,
          content: templateToBeDeleted,
          label: 'relationshipToBeDeleted',
          name: 'relationshipToBeDeleted',
        },
      ],
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    },
    {
      _id: templateWithContents,
      name: 'content template',
      commonProperties: [{ _id: db.id(), name: 'title', label: 'Title', type: 'text' }],
      properties: [
        {
          _id: select3id,
          type: propertyTypes.select,
          content: thesauriId1.toString(),
          label: 'select3',
          name: 'select3',
        },
        {
          _id: select4id,
          type: propertyTypes.multiselect,
          content: thesauriId1.toString(),
          label: 'select4',
          name: 'select4',
        },
        {
          _id: db.id(),
          type: propertyTypes.generatedid,
          label: 'Generated Id',
          name: 'generated_id',
        },
      ],
    },
    {
      _id: swapTemplate,
      name: 'swap names template',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        { _id: 'text_id', type: propertyTypes.text, name: 'text', label: 'Text' },
        { _id: 'select_id', type: propertyTypes.select, name: 'select5', label: 'Select5' },
      ],
    },
    {
      _id: templateToBeInherited,
      name: 'template to be inherited',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        { _id: propertyToBeInherited, name: 'inherit_me', type: 'text' },
        { _id: propertyToBeInherited2, name: 'inherit_me_as_well', type: 'text' },
      ],
      default: true,
    },
    {
      _id: templateInheritingFromAnother,
      name: 'template inheriting from another',
      commonProperties: [{ _id: db.id(), name: 'title', label: 'Title', type: 'text' }],
      properties: [
        {
          _id: db.id(),
          type: propertyTypes.relationship,
          name: 'inherit',
          label: 'Inherit',
          relationType: relatedTo.toString(),
          content: templateToBeInherited.toString(),
          inherit: {
            property: propertyToBeInherited.toString(),
            type: 'text',
          },
        },
      ],
    },
    {
      _id: templateWithExtractedMetadata,
      name: 'template_with_extracted_metadata',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        {
          _id: propertyA,
          label: 'Property A',
          name: 'property_a',
          type: 'text',
        },
        {
          _id: propertyB,
          label: 'Property B',
          name: 'property_b',
          type: 'markdown',
        },
        {
          _id: propertyC,
          label: 'Property C',
          name: 'property_c',
          type: 'numeric',
        },
        {
          _id: propertyD,
          label: 'Property D',
          name: 'property_d',
          type: 'link',
        },
      ],
    },
  ],
  relationtypes: [{ _id: relatedTo, name: 'related to' }],
  settings: [
    {
      _id: db.id(),
      site_name: 'Uwazi',
      languages,
    },
  ],
  dictionaries: [
    { _id: thesauriId1, name: 'options' },
    { _id: thesauriId2, name: 'options' },
  ],
  files: [
    {
      filename: 'file1.pdf',
      extractedMetadata: [
        {
          propertyID: propertyA.toString(),
          name: 'property_a',
          selection: { text: 'sample text of file 1 for propA' },
        },
        {
          propertyID: propertyB.toString(),
          name: 'property_b',
          selection: { text: 'sample text of file 1 for propB' },
        },
        {
          propertyID: propertyC.toString(),
          name: 'property_c',
          selection: { text: 'a number in file 1' },
        },
      ],
    },
    {
      filename: 'file2.pdf',
      extractedMetadata: [
        {
          propertyID: propertyA.toString(),
          name: 'property_a',
          selection: { text: 'sample text of file 1 for propA' },
        },
      ],
    },
    {
      filename: 'file3.pdf',
      extractedMetadata: [],
    },
  ],
  pages: [
    {
      _id: db.id(),
      title: 'Main page',
      metadata: {
        content: '## Page\nWelcome to the main page',
      },
      creationDate: 1643973497164,
      language: 'en',
      sharedId: pageSharedId,
      entityView: true,
    },
  ],
  entities: [
    ...createEntitiesInAllLanguages('t1-1', thesaurusTemplateId, {
      select: [],
      relationshipToBeDeleted: [],
    }),
    ...createEntitiesInAllLanguages('t1-2', thesaurusTemplateId, {
      select: [],
      relationshipToBeDeleted: [],
    }),
    ...createEntitiesInAllLanguages('t1-3', thesaurusTemplateId, {
      select: [],
      relationshipToBeDeleted: [],
    }),
    ...createEntitiesInAllLanguages('t2-1', thesaurusTemplate2Id, {
      select2: [],
      relationshipToBeDeleted: [],
    }),
  ],
};

export default fixtures;

export {
  templateToBeEditedId,
  templateToBeDeleted,
  thesaurusTemplateId,
  thesaurusTemplate2Id,
  thesaurusTemplate3Id,
  templateWithContents,
  swapTemplate,
  templateToBeInherited,
  templateInheritingFromAnother,
  propertyToBeInherited,
  propertyToBeInherited2,
  relatedTo,
  thesauriId1,
  thesauriId2,
  templateWithExtractedMetadata,
  propertyA,
  propertyB,
  propertyC,
  propertyD,
  select3id,
  select4id,
  pageSharedId,
};
