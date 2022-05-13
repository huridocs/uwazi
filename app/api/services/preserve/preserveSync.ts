import entities from 'api/entities';
import { fileFromReadStream, files, generateFileName } from 'api/files';
import { permissionsContext } from 'api/permissions/permissionsContext';
import settings from 'api/settings';
import { tenants } from 'api/tenants';
import path from 'path';
import qs from 'qs';
import request from 'shared/JSONRequest';
import { EntitySchema } from 'shared/types/entityType';
import { PreserveConfig } from 'shared/types/settingsType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { preserveSyncModel } from './preserveSyncModel';
import { errorLog } from 'api/log';

const saveEvidence =
  (token: string, template: ObjectIdSchema, host: string) =>
  async (previous: Promise<EntitySchema>, evidence: any) => {
    await previous;

    try {
      const { sharedId } = await entities.save(
        { title: evidence.attributes.title, template },
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
