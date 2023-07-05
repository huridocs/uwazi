import { files } from 'api/files';
import translations from 'api/i18n/translations';
import db from 'api/utils/testing_db';
import { TemplateSchema } from 'shared/types/templateType';
import templates from '../templates';
import fixtures, {
  propertyA,
  propertyB,
  propertyC,
  propertyD,
  templateWithExtractedMetadata,
} from './fixtures/fixtures';

describe('updateExtractedMetadataProperties()', () => {
  beforeEach(async () => {
    jest.spyOn(translations, 'updateContext').mockImplementation(async () => 'ok');
    await db.clearAllAndLoad(fixtures, 'uwazi_test_index');
  });

  it('should remove deleted template properties from extracted metadata on files', async () => {
    const templateToUpdate: TemplateSchema = {
      _id: templateWithExtractedMetadata,
      name: 'template_with_extracted_metadata',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        {
          _id: propertyA.toString(),
          label: 'Property A',
          name: 'property_a',
          type: 'text',
        },
        {
          _id: propertyD.toString(),
          label: 'Property D',
          name: 'property_d',
          type: 'link',
        },
        {
          label: 'New unrelated property',
          name: 'new_unrelated_property',
          type: 'image',
        },
        {
          label: 'New text property',
          name: 'new_text_property',
          type: 'text',
        },
      ],
    };

    await templates.save(templateToUpdate, 'en');

    expect((await files.get())[0]).toMatchObject({
      filename: 'file1.pdf',
      extractedMetadata: [
        {
          name: 'property_a',
        },
      ],
    });
    expect((await files.get())[1]).toMatchObject({
      filename: 'file2.pdf',
      extractedMetadata: [
        {
          name: 'property_a',
        },
      ],
    });
    expect((await files.get())[2]).toMatchObject({
      filename: 'file3.pdf',
      extractedMetadata: [],
    });
  });

  it('should rename properties when they get renamed in the templates', async () => {
    const templateWithRenamedProps: TemplateSchema = {
      _id: templateWithExtractedMetadata,
      name: 'template_with_extracted_metadata',
      commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
      properties: [
        {
          _id: propertyA.toString(),
          label: 'Property A',
          name: 'property_a',
          type: 'text',
        },
        {
          _id: propertyB.toString(),
          label: 'Property B',
          name: 'property_b',
          type: 'markdown',
        },
        {
          _id: propertyC.toString(),
          label: 'Property C but renamed',
          name: 'property_c_but_renamed',
          type: 'numeric',
        },
        {
          _id: propertyD.toString(),
          label: 'Property D',
          name: 'property_d',
          type: 'link',
        },
      ],
    };

    await templates.save(templateWithRenamedProps, 'en');

    expect((await files.get())[0]).toMatchObject({
      filename: 'file1.pdf',
      extractedMetadata: [
        {
          name: 'property_a',
        },
        {
          name: 'property_b',
        },
        {
          name: 'property_c_but_renamed',
        },
      ],
    });
    expect((await files.get())[1]).toMatchObject({
      filename: 'file2.pdf',
      extractedMetadata: [
        {
          name: 'property_a',
        },
      ],
    });
    expect((await files.get())[2]).toMatchObject({
      filename: 'file3.pdf',
      extractedMetadata: [],
    });
  });

  afterAll(async () => db.disconnect());
});
