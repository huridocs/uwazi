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
import { preserveSyncModel } from './preserveSyncModel';

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
    const preservationSync = await preserveSyncModel.db.findOne({}, {});

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
        Authorization: preserveConfig.token,
      }
    );

    await evidences.json.data.reduce(async (previous: Promise<EntitySchema>, evidence: any) => {
      await previous;
      const { sharedId } = await entities.save(
        { title: evidence.attributes.title, template: preserveConfig.template },
        { language: 'en', user: {} }
      );
      await Promise.all(
        evidence.attributes.downloads.map(async (download: any) => {
          const fileName = generateFileName({ originalname: path.basename(download.path) });
          const fileStream = (
            await fetch(new URL(path.join(preserveConfig.host, download.path)).toString(), {
              headers: { Authorization: preserveConfig.token },
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
    }, Promise.resolve());

    if (evidences.json.data.length) {
      await preserveSyncModel.save({
        ...(preservationSync ? { _id: preservationSync._id } : {}),
        lastImport: evidences.json.data[evidences.json.data.length - 1].attributes.date,
      });
    }
  },
};

export { preserveSync };
