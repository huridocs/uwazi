import { WithId } from 'api/odm';
import thesauri from 'api/thesauri';
import settings from 'api/settings';
import templates from 'api/templates';
import request from 'shared/JSONRequest';
import createError from 'api/utils/Error';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { TemplateSchema } from 'shared/types/templateType';
import { User } from 'api/users/usersModel';
import { PreserveConfig } from 'shared/types/settingsType';
import { ObjectIdSchema } from 'shared/types/commonTypes';

export const Preserve = {
  async setup(language: string, user: User) {
    const currentSettings: any = await settings.get({});
    const preserve: PreserveConfig | undefined = currentSettings?.features?.preserve;

    if (!preserve) {
      throw createError('Preserve configuration not found', 402);
    }

    let userConfig = preserve.config?.find(conf => conf.user?.toString() === user._id.toString());

    if (userConfig) {
      return userConfig;
    }

    userConfig = await this.createUserConfig(preserve, language, user);

    await settings.save({
      ...currentSettings,
      features: {
        ...currentSettings.features,
        preserve: {
          host: preserve.host,
          masterToken: preserve.masterToken,
          config: [...(preserve.config || []), userConfig],
        },
      },
    });
    return userConfig;
  },

  async createUserConfig(preserve: PreserveConfig, language: string, user: User) {
    let templateId: ObjectIdSchema;
    if (preserve.config?.length) {
      templateId = preserve.config[0].template;
    } else {
      templateId = await (await this.createTemplate(language))!._id;
    }
    const token = await this.requestToken(preserve.host, {
      Authorization: preserve.masterToken,
    });

    return {
      template: templateId,
      token,
      user: user._id,
    };
  },

  async requestToken(host: string, headers: { [key: string]: string }) {
    const resp = await request.post(`${host}/api/tokens`, {}, headers);
    return resp.json.data.token;
  },

  async createTemplate(language: string) {
    const fetchedThesauri = await Preserve.createEmptyThesauri();
    const toSave: TemplateSchema = {
      name: 'Preserve',
      commonProperties: [
        { label: 'Title', name: 'title', type: 'text' },
        { name: 'creationDate', label: 'Date added', type: 'date' },
        { name: 'editDate', label: 'Date modified', type: 'date' },
      ],
      properties: [
        { type: 'link', name: 'url', label: 'Url' },
        {
          type: 'select',
          name: 'source',
          label: 'Source',
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
