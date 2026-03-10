import { WithId } from 'api/odm';
import settings from 'api/settings';
import request from 'shared/JSONRequest';
import createError from 'api/utils/Error';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { User } from 'api/users/usersModel';
import { PreserveConfig } from 'shared/types/settingsType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { PropertyTypeEnum } from 'api/core/domain/template/PropertyType';
import { TemplateFacade } from 'api/core/infrastructure/facades/TemplateFacade';
import { ThesauriService } from 'api/core/application/ThesauriService';
import { ThesauriDataSourceFactory } from 'api/core/infrastructure/factories/ThesauriDataSourceFactory';
import { ThesaurusTranslationService } from 'api/core/application/thesaurusTranslationService/ThesaurusTranslationService';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { Thesaurus } from 'api/core/domain/thesaurus/Thesaurus';
import { MongoThesaurusMapper } from 'api/core/infrastructure/mongodb/thesauri/MongoThesaurusMapper';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { tenants } from 'api/tenants';

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

  /**
   * Note: Re-usability of features are wrong here (Create Template and Create Thesaurus).
   * Still needs to check but the actual feature here is the process of setting up the preserve, so
   * it is expected that this should be a use case the control the transaction, so it's up to this use case
   * decide either or not have creation of Template, Thesaurus transactional consistent (inside same transaction).
   *
   * For now, we are creating separated transaction for Thesaurus creation inside `createEmptyThesauri` method and
   * another for Template creation here - this is not ideal at all.
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
    const transactionManager = TransactionManagerFactory.default();

    const thesauriService = new ThesauriService({
      thesauriDS: ThesauriDataSourceFactory.default(transactionManager),
      thesaurusTranslationService: new ThesaurusTranslationService({
        settingsDS: SettingsDataSourceFactory.default(transactionManager),
        translationsDS: DefaultTranslationsDataSource(transactionManager),
      }),
      jobsDispatcher: DefaultDispatcher(tenants.current().name, transactionManager),
    });

    const thesaurus = Thesaurus.create({
      name: name || 'Preserve',
      values: [],
    });

    await transactionManager.run(async () => thesauriService.insert(thesaurus));

    return MongoThesaurusMapper.toDBO(thesaurus) as WithId<ThesaurusSchema>;
  },
};
