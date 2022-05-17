import entities from 'api/entities';
import { fileFromReadStream, files, generateFileName } from 'api/files';
import { errorLog } from 'api/log';
import { permissionsContext } from 'api/permissions/permissionsContext';
import settings from 'api/settings';
import templates from 'api/templates';
import { tenants } from 'api/tenants';
import path from 'path';
import qs from 'qs';
import request from 'shared/JSONRequest';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { PreserveConfig } from 'shared/types/settingsType';
import { preserveSyncModel } from './preserveSyncModel';

const saveEvidence =
  (token: string, templateId: ObjectIdSchema, host: string) =>
  async (previous: Promise<EntitySchema>, evidence: any) => {
    await previous;

    try {
      const template = await templates.getById(templateId);

      const hasURLProperty = (template?.properties || []).find(
        property => property.name === 'url' && property.type === 'link'
      );

      const hasSourceProperty = (template?.properties || []).find(
        property => property.name === 'source' && property.type === 'text'
      );

      const { sharedId } = await entities.save(
        {
          title: evidence.attributes.title,
          template: templateId,
          metadata: {
            ...(hasURLProperty
              ? { url: [{ value: { label: '', url: evidence.attributes.url } }] }
              : {}),
            ...(hasSourceProperty
              ? { source: [{ value: new URL(evidence.attributes.url).hostname }] }
              : {}),
          },
        },
        { language: 'en', user: {} }
      );
      await Promise.all(
        evidence.attributes.downloads.map(async (download: any) => {
          const fileName = generateFileName({ originalname: path.basename(download.path) });
          const fileStream = (
            await fetch(new URL(path.join(host, download.path)).toString(), {
              headers: { Authorization: token },
            })
          ).body as unknown as NodeJS.ReadableStream;
          if (fileStream) {
            await fileFromReadStream(fileName, fileStream);

            await files.save({
              entity: sharedId,
              type: 'attachment',
              filename: fileName,
              originalname: path.basename(download.path),
            });
          }
        })
      );
    } catch (error) {
      errorLog.error(error);
    }
  };

const preserveSync = {
  async syncAllTenants() {
    return Object.keys(tenants.tenants).reduce(async (previous, tenantName) => {
      await previous;
      return tenants.run(async () => {
        permissionsContext.setCommandContext();
        const { features } = await settings.get({}, 'features.preserve');
        if (features?.preserve) {
          await this.sync(features.preserve);
        }
      }, tenantName);
    }, Promise.resolve());
  },

  async sync(preserveConfig: PreserveConfig) {
    // eslint-disable-next-line no-restricted-syntax
    for await (const config of preserveConfig.config) {
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
        saveEvidence(config.token, config.template, preserveConfig.host),
        Promise.resolve()
      );

      if (evidences.json.data.length) {
        await preserveSyncModel.save({
          ...(preservationSync ? { _id: preservationSync._id } : {}),
          lastImport: evidences.json.data[evidences.json.data.length - 1].attributes.date,
          token: config.token,
        });
      }
    }
  },
};

export { preserveSync };
