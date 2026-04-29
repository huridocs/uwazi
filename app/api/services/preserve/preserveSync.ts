import mimetypes from 'mime-types';
import { ObjectId } from 'mongodb';
import path from 'path';
import qs from 'qs';
import { Readable } from 'stream';
import { PropertyAssignmentInput } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorService.js';
import { PropertyAssignmentCreatorServiceStrategy } from '#api/core/application/propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy.js';
import { FileAttachment } from '#api/core/domain/files/FileAttachment.js';
import { EntitiesDataSourceFactory } from '#api/core/infrastructure/factories/EntitiesDataSourceFactory.js';
import { EntitiesServiceFactory } from '#api/core/infrastructure/factories/EntitiesServiceFactory.js';
import { FilesServiceFactory } from '#api/core/infrastructure/factories/FilesServiceFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';
import templates from '#api/core/v1_layer/templates/index.js';
import { DefaultTranslationsDataSource } from '#api/i18n.v2/database/data_source_defaults.js';
import { runInJobContext } from '#api/services/tasksmanager/runInJobContext.js';
import { legacyLogger } from '#api/log/index.js';
import { EnforcedWithId } from '#api/odm/index.js';
import settings from '#api/settings/index.js';
import { tenants } from '#api/tenants/index.js';
import thesauri from '#api/thesauri/index.js';
import dictionariesModel from '#api/thesauri/dictionariesModel.js';
import users from '#api/users/users.js';
import { newThesauriId } from '#api/utils/templateUtils.js';
import request from '#shared/JSONRequest.js';
import { propertyTypes } from '#shared/propertyTypes.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { PreserveConfig } from '#shared/types/settingsType.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { preserveSyncModel } from './preserveSyncModel.js';

const thesauriValueId = async (thesauriId: ObjectIdSchema, valueLabel: string) => {
  const [value] = await dictionariesModel.db.aggregate([
    { $match: { _id: new ObjectId(thesauriId) } },
    { $unwind: '$values' },
    { $match: { 'values.label': valueLabel } },
    { $replaceRoot: { newRoot: '$values' } },
  ]);

  return value?.id;
};

const getSourceThesauriId = async (template: EnforcedWithId<TemplateSchema> | null) =>
  (template?.properties || []).find(
    property => property.name === 'source' && property.type === propertyTypes.select
  );

const extractSource = async (
  template: EnforcedWithId<TemplateSchema> | null,
  evidence: { [k: string]: any }
) => {
  const sourceProperty = await getSourceThesauriId(template);

  if (!sourceProperty) {
    return {};
  }

  const { hostname } = new URL(evidence.attributes.url);
  let valueId = await thesauriValueId(sourceProperty.content || '', hostname);
  const contentThesauri = await thesauri.getById(sourceProperty.content);

  if (!valueId && contentThesauri) {
    valueId = newThesauriId();
    await dictionariesModel.db.updateOne(
      { _id: sourceProperty.content },
      { $push: { values: { label: hostname, id: valueId } } }
    );
  }

  return valueId ? { source: [{ value: valueId }] } : {};
};

const extractURL = async (
  template: EnforcedWithId<TemplateSchema> | null,
  evidence: { [k: string]: any }
) => {
  const hasURLProperty = (template?.properties || []).find(
    property => property.name === 'url' && property.type === propertyTypes.link
  );

  return hasURLProperty ? { url: [{ value: { label: '', url: evidence.attributes.url } }] } : {};
};

const extractDate = async (
  template: EnforcedWithId<TemplateSchema> | null,
  evidence: { [k: string]: any }
) => {
  const hasDateProperty = (template?.properties || []).find(
    property => property.name === 'preservation_date' && property.type === propertyTypes.date
  );

  return hasDateProperty
    ? {
        preservation_date: [{ value: Date.parse(evidence.attributes.date) / 1000 }],
      }
    : {};
};

const saveEvidence =
  (config: PreserveConfig['config'][0], host: string) =>
  async (previous: Promise<string | undefined>, evidence: any): Promise<string | undefined> => {
    await previous;

    try {
      // Skip evidences with empty titles
      if (!evidence.attributes.title) {
        return undefined;
      }

      const template = await templates.getById(config.template);
      const user = await users.getById(config.user);

      // Set up V2 services
      const transactionManager = TransactionManagerFactory.default();
      const entitiesDS = EntitiesDataSourceFactory.default({ transactionManager });
      const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
      const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
      const translationsDS = DefaultTranslationsDataSource(transactionManager);

      const propertyAssignmentStrategy = PropertyAssignmentCreatorServiceStrategy.create({
        entitiesDS,
        settingsDS,
        thesauriDS,
        translationsDS,
      });
      const entitiesService = EntitiesServiceFactory.default({
        entitiesDS,
        transactionManager,
      });

      const entity = await entitiesService.create({
        templateId: config.template.toString(),
        userId: user?._id?.toString(),
      });

      const propertyAssignments: PropertyAssignmentInput[] = [
        {
          name: 'title',
          value: [{ value: evidence.attributes.title }],
        },
      ];

      const urlMetadata = await extractURL(template, evidence);
      if (urlMetadata.url) {
        propertyAssignments.push({
          name: 'url',
          value: urlMetadata.url,
        });
      }

      const sourceMetadata = await extractSource(template, evidence);
      if (sourceMetadata.source) {
        propertyAssignments.push({
          name: 'source',
          value: sourceMetadata.source,
        });
      }

      const dateMetadata = await extractDate(template, evidence);
      if (dateMetadata.preservation_date) {
        propertyAssignments.push({
          name: 'preservation_date',
          value: dateMetadata.preservation_date,
        });
      }

      const assignments = await propertyAssignmentStrategy.bulkCreate(
        propertyAssignments,
        entity.template,
        []
      );
      entity.setPropertyAssignmentsInAllLanguages(assignments);

      const { sharedId } = entity;

      const attachments: FileAttachment[] = [];
      const filesService = FilesServiceFactory.default();

      await Promise.all(
        evidence.attributes.downloads.map(async (download: any) => {
          const fileStream = (
            await fetch(new URL(path.join(host, download.path)).toString(), {
              headers: { Authorization: config.token },
            })
          ).body as unknown as Readable;

          if (!fileStream) {
            throw new Error(`Failed to fetch file from: ${download.path}`);
          }

          const inputFile = await InputFile.fromStream({
            stream: fileStream,
            originalname: path.basename(download.path),
            mimetype: mimetypes.lookup(path.extname(download.path)) || 'application/octet-stream',
            type: 'attachment',
          });

          const fileId = IdGeneratorFactory.default().generate();
          attachments.push(inputFile.toEntityFile(sharedId, fileId) as FileAttachment);
        })
      );

      await filesService.storeFiles(attachments);

      const defaultLanguage = await settings.getDefaultLanguage();

      await transactionManager.run(async () => {
        await filesService.insert(attachments);
        await entitiesService.insert(entity, {
          tenantName: tenants.current().name,
          actorId: user?._id?.toString() || 'system',
          targetLanguage: defaultLanguage.key,
        });
      });

      return sharedId;
    } catch (error) {
      legacyLogger.error(error);
      return undefined;
    }
  };

const preserveSync = {
  async syncAllTenants() {
    return Object.keys(tenants.tenants).reduce(async (previous, tenantName) => {
      await previous;
      return runInJobContext(tenantName, async () => {
        const { features } = await settings.get({}, 'features.preserve');
        if (features?.preserve) {
          await this.sync(features.preserve);
        }
      });
    }, Promise.resolve());
  },

  async sync(preserveConfig: PreserveConfig) {
    // eslint-disable-next-line no-restricted-syntax
    await preserveConfig.config.reduce(async (promise, config) => {
      await promise;
      const preservationSync = await preserveSyncModel.db.findOne({ token: config.token }, {});

      const queryString = qs.stringify({
        filter: {
          status: 'PROCESSED',
          ...(preservationSync ? { date: { gt: preservationSync.lastImport } } : {}),
        },
      });

      const evidences = await request.get(
        `${preserveConfig.host}/api/evidences?${queryString}`,
        {},
        {
          Authorization: config.token,
        }
      );

      await evidences.json.data.reduce(
        saveEvidence(config, preserveConfig.host),
        Promise.resolve()
      );

      if (evidences.json.data.length) {
        await preserveSyncModel.save({
          ...(preservationSync ? { _id: preservationSync._id } : {}),
          lastImport: evidences.json.data[evidences.json.data.length - 1].attributes.date,
          token: config.token,
        });
      }
    }, Promise.resolve());
  },
};

export { preserveSync };
