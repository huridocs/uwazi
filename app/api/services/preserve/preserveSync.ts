import { permissionsContext } from 'api/permissions/permissionsContext';
import settings from 'api/settings';
import { tenants } from 'api/tenants';
import request from 'shared/JSONRequest';
import entities from 'api/entities';
import { Settings } from 'shared/types/settingsType';
import { EntitySchema } from 'shared/types/entityType';
import qs from 'qs';
import { preserveSyncModel } from './preserveSyncModel';
import { fileFromReadStream, files, generateFileName } from 'api/files';
import path from 'path';
import { saveEntity } from 'api/entities/entitySavingManager';
import { Readable } from 'stream';

const preserveSync = {
  async syncAllTenants() {
    return Object.keys(tenants.tenants).reduce(async (previous, tenantName) => {
      await previous;
      return tenants.run(async () => {
        permissionsContext.setCommandContext();
        const { features } = await settings.get({}, 'features.preserve');
        return this.sync(features);
      }, tenantName);
    }, Promise.resolve());
  },

  async sync(features: Settings['features']) {
    if (features?.preserve) {
      const config = features.preserve;

      const preservationSync = await preserveSyncModel.db.findOne({}, {});

      const queryString = qs.stringify({
        filter: {
          status: 'PROCESSED',
          ...(preservationSync ? { date: { gt: preservationSync.lastImport } } : {}),
        },
      });

      const evidences = await request.get(
        `${config.host}/api/evidences?${queryString}`,
        {},
        {
          Authorization: config.token,
        }
      );

      // console.log(evidences);

      await evidences.json.data.reduce(async (previous: Promise<EntitySchema>, evidence: any) => {
        await previous;
        const { sharedId } = await entities.save(
          { title: evidence.attributes.title, template: config.template },
          { language: 'en', user: {} }
        );
        await Promise.all(
          evidence.attributes.downloads.map(async (download: any) => {
            const fileName = generateFileName({ originalname: path.basename(download.path) });
            const fileStream = (
              await fetch(new URL(path.join(config.host, download.path)).toString(), {
                headers: { Authorization: config.token },
              })
            ).body;
            if (fileStream) {
              await fileFromReadStream(fileName, fileStream);

              return files.save({
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
    }
  },
};

export { preserveSync };
