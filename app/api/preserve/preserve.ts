import { WithId } from '#api/odm/index.js';
import { SettingsQueryServiceFactory } from '#api/core/infrastructure/factories/SettingsQueryServiceFactory.js';
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import request from '#shared/JSONRequest.js';
import createError from '#api/utils/Error.js';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import { User } from '#api/users/usersModel.js';
import { PreserveConfig } from '#shared/types/settingsType.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import { TemplateFacade } from '#api/core/infrastructure/facades/TemplateFacade.js';
import { CreateThesaurusUseCaseFactory } from '#api/core/infrastructure/factories/CreateThesaurusUseCaseFactory.js';
import { MongoThesaurusMapper } from '#api/core/infrastructure/mongodb/thesauri/MongoThesaurusMapper.js';

export const Preserve = {
  async setup(language: string, user: User) {
    const currentSettings: any = await SettingsQueryServiceFactory.default().get();
    const preserve: PreserveConfig | undefined = currentSettings?.features?.preserve;

    if (!preserve) {
      throw createError('Preserve configuration not found', 402);
    }

    let userConfig = preserve.config?.find(conf => conf.user?.toString() === user._id.toString());

    if (userConfig) {
      return userConfig;
    }

    userConfig = await this.createUserConfig(preserve, language, user);

    await SaveSettingsUseCaseFactory.default().execute({
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

  /**
   * Note: Re-usability of features are wrong here (Create Template and Create Thesaurus).
   * Still needs to check but the actual feature here is the process of setting up the preserve, so
   * it is expected that this should be a use case the control the transaction, so it's up to this use case
   * decide either or not have creation of Template, Thesaurus transactional consistent (inside same transaction).
   *
   * For now, Thesaurus creation goes through CreateThesaurusUseCase (owns its TM.run) and Template
   * creation is a separate transaction — this is not ideal at all.
   */

  async createTemplate(_language: string) {
    const fetchedThesauri = await Preserve.createEmptyThesauri();

    return TemplateFacade.createWithDefaultValues({
      name: 'Preserve',
      properties: [
        { type: PropertyTypeEnum.Link, label: 'Url' },
        {
          type: PropertyTypeEnum.Select,
          label: 'Source',
          content: fetchedThesauri._id.toString(),
        },
      ],
    });
  },

  async createEmptyThesauri(name?: string): Promise<WithId<ThesaurusSchema>> {
    const thesaurus = await CreateThesaurusUseCaseFactory.default().execute({
      name: name || 'Preserve',
      values: [],
    });

    return MongoThesaurusMapper.toDBO(thesaurus) as WithId<ThesaurusSchema>;
  },
};
