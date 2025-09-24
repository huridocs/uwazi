// @ts-expect-error TS(2307): Cannot find module '../entities/index.js' or its c... Remove this comment to see the full error message
import entities from '../entities/index.js';
// @ts-expect-error TS(2307): Cannot find module '../files.js' or its correspond... Remove this comment to see the full error message
import { files, generateFileName, storage } from '../files.js';
// @ts-expect-error TS(2307): Cannot find module '../log/index.js' or its corres... Remove this comment to see the full error message
import { legacyLogger } from '../log/index.js';

import { EnforcedWithId } from '../odm/index.js';
// @ts-expect-error TS(2307): Cannot find module '../settings/index.js' or its c... Remove this comment to see the full error message
import settings from '../settings/index.js';
// @ts-expect-error TS(2307): Cannot find module '../templates/index.js' or its ... Remove this comment to see the full error message
import templates from '../templates/index.js';
// @ts-expect-error TS(2307): Cannot find module '../templates/utils.js' or its ... Remove this comment to see the full error message
import { newThesauriId } from '../templates/utils.js';
// @ts-expect-error TS(2307): Cannot find module '../tenants.js' or its correspo... Remove this comment to see the full error message
import { tenants } from 'api/tenants/index.js';
// @ts-expect-error TS(2307): Cannot find module '../thesauri.js' or its corresp... Remove this comment to see the full error message
import thesauri from '../thesauri.js';
// @ts-expect-error TS(2307): Cannot find module '../thesauri/dictionariesModel.... Remove this comment to see the full error message
import dictionariesModel from '../thesauri/dictionariesModel.js';
// @ts-expect-error TS(2307): Cannot find module '../users/users.js' or its corr... Remove this comment to see the full error message
import users from '../users/users.js';
// @ts-expect-error TS(2307): Cannot find module '../utils/AppContext.js' or its... Remove this comment to see the full error message
import { appContext } from '../utils/AppContext.js';
import { ObjectId } from 'mongodb';
import path from 'path';
import qs from 'qs';
// @ts-expect-error TS(2307): Cannot find module '../../shared/JSONRequest.js' o... Remove this comment to see the full error message
import request from 'shared/JSONRequest.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/propertyTypes.js'... Remove this comment to see the full error message
import { propertyTypes } from 'shared/propertyTypes.js';

import { ObjectIdSchema } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/settingsTyp... Remove this comment to see the full error message
import { PreserveConfig } from 'shared/types/settingsType.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/templateTyp... Remove this comment to see the full error message
import { TemplateSchema } from 'shared/types/templateType.js';
import { Readable } from 'stream';
import mimetypes from 'mime-types';
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
    // @ts-expect-error TS(7006): Parameter 'property' implicitly has an 'any' type.
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
      // @ts-ignore
      { $push: { values: { label: hostname, _id: new ObjectId(), id: valueId } } }
    );
  }

  return valueId ? { source: [{ value: valueId }] } : {};
};

const extractURL = async (
  template: EnforcedWithId<TemplateSchema> | null,
  evidence: { [k: string]: any }
) => {
  const hasURLProperty = (template?.properties || []).find(
    // @ts-expect-error TS(7006): Parameter 'property' implicitly has an 'any' type.
    property => property.name === 'url' && property.type === propertyTypes.link
  );

  return hasURLProperty ? { url: [{ value: { label: '', url: evidence.attributes.url } }] } : {};
};

const extractDate = async (
  template: EnforcedWithId<TemplateSchema> | null,
  evidence: { [k: string]: any }
) => {
  const hasDateProperty = (template?.properties || []).find(
    // @ts-expect-error TS(7006): Parameter 'property' implicitly has an 'any' type.
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
  async (previous: Promise<EntitySchema>, evidence: any) => {
    await previous;

    try {
      const template = await templates.getById(config.template);
      const user = await users.getById(config.user);

      if (user) {
        appContext.set('user', user);
      }

      const { sharedId } = await entities.save(
        {
          title: evidence.attributes.title,
          template: config.template,
          metadata: {
            ...(await extractURL(template, evidence)),
            ...(await extractSource(template, evidence)),
            ...(await extractDate(template, evidence)),
          },
        },
        { language: 'en', user: user || {} }
      );
      await Promise.all(
        // @ts-expect-error TS(7006): Parameter 'download' implicitly has an 'any' type.
        evidence.attributes.downloads.map(async download => {
          const fileName = generateFileName({ originalname: path.basename(download.path) });
          const fileStream = (
            await fetch(new URL(path.join(host, download.path)).toString(), {
              headers: { Authorization: config.token },
            })
          ).body as unknown as Readable;
          if (fileStream) {
            await storage.storeFile(fileName, fileStream, 'attachment');

            await files.save({
              entity: sharedId,
              type: 'attachment',
              filename: fileName,
              originalname: path.basename(download.path),
              mimetype: mimetypes.lookup(path.extname(fileName)) || 'application/octet-stream',
            });
          }
        })
      );
    } catch (error) {
      legacyLogger.error(error);
    }
  };

const preserveSync = {
  async syncAllTenants() {
    return Object.keys(tenants.tenants).reduce(async (previous, tenantName) => {
      await previous;
      return tenants.run(async () => {
        const { features } = await settings.get({}, 'features.preserve');
        if (features?.preserve) {
          await this.sync(features.preserve);
        }
      }, tenantName);
    }, Promise.resolve());
  },

  async sync(preserveConfig: PreserveConfig) {
    // @ts-expect-error TS(7006): Parameter 'promise' implicitly has an 'any' type.
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
