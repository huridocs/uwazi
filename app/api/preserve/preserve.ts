import { WithId } from 'api/odm';
import thesauri from 'api/thesauri';
import settings from 'api/settings';
import templates from 'api/templates';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { TemplateSchema } from 'shared/types/templateType';

export const Preserve = {
  // eslint-disable-next-line max-statements
  async setup(language: string) {
    const currentSettings: any = await settings.get({});
    const { features } = currentSettings;
    const preserve = currentSettings.features?.preserve;

    if (!features || !preserve) {
      const host = preserve?.host || '';
      let templateId = preserve ? preserve.config[0].template : false;
      if (!templateId) {
        templateId = await (await this.createTemplate(language))._id;
      }
      const currentPreserve = {
        host,
        config: [
          {
            template: templateId,
            token: preserve?.config[0].token || 'AAA-BBB-CCC-000-111',
            user: preserve?.config[0].user,
          },
        ],
      };
      const newFeatures = { ...features, preserve: currentPreserve };
      await settings.save({ ...currentSettings, features: newFeatures });
    }
  },
  async createTemplate(language: string) {
    const fetchedThesauri = await Preserve.createEmptyThesauri();
    const toSave: TemplateSchema = {
      name: 'Preserve',
      commonProperties: [
        {
          label: 'Title',
          name: 'title',
          isCommonProperty: true,
          type: 'text',
        },
        {
          label: 'Date added',
          name: 'creationDate',
          isCommonProperty: true,
          type: 'date',
        },
      ],
      properties: [
        {
          type: 'link',
          name: 'url',
          label: 'url',
        },
        {
          type: 'select',
          name: 'source',
          label: 'source',
          content: fetchedThesauri._id.toString(),
        },
      ],
    };
    return templates.save(toSave, language);
  },
  async createEmptyThesauri(name?: string): Promise<WithId<ThesaurusSchema>> {
    const internalName = name || 'Preserve';
    const toSave = {
      name: internalName,
      values: [],
    };
    const createdThesauri = await thesauri.save(toSave);
    return createdThesauri;
  },
};
