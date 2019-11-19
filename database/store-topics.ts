/** @format */
/* eslint-disable no-await-in-loop */

import connect, { disconnect } from 'api/utils/connect_to_mongo';
import yargs from 'yargs';
import JSONRequest from 'shared/JSONRequest';
import entities from 'api/entities';
import thesauri from 'api/thesauris';
import templates from 'api/templates';
import { WithId } from 'api/odm';
import { EntitySchema } from '../app/api/entities/entityType';

const { server, seq_prop: seqPropName, max_upload: maxUpload, thesaurus, mode } = yargs
  .option('mode', { type: 'string', default: 'store' })
  .option('server', { default: 'http://localhost:5000', type: 'string' })
  .option('seq_prop', { default: 'recommendation', type: 'string' })
  .option('thesaurus', { default: 'Issues', type: 'string' })
  .option('max_upload', { default: 100000 })
  .option('store_label_ids', { default: false })
  .help().argv;

async function storeSamples(request: any, model: string) {
  const response = await JSONRequest.post(
    `${server}/classification_sample?model=${model}`,
    request
  );
  if (response.status !== 200) {
    console.error(response);
  }
}

connect().then(async () => {
  try {
    if (!process.env.DATABASE_NAME) {
      throw new Error('You need to set $DATABASE_NAME!');
    }
    if (mode === 'store') {
      const allThesauri = await thesauri.get();
      const selectedThesaurus = allThesauri.find(t => t.name === thesaurus);
      if (!selectedThesaurus) {
        throw new Error(`Did not find thesaurus ${thesaurus}.`);
      }
      const allTemplates = await templates.get();
      const templateAndProp = allTemplates.reduce((res: { [k: string]: string }, t) => {
        if (!t.properties) {
          return res;
        }
        const thesProp = t.properties.find(
          (p: any) => p.content === selectedThesaurus._id.toString()
        );
        if (!thesProp) {
          return res;
        }
        return {
          ...res,
          [t._id.toString()]: thesProp.name,
        };
      }, {});

      const modelName = `${process.env.DATABASE_NAME}-${thesaurus
        .toLowerCase()
        .replace(/ /g, '_')}`;
      const request: any = { samples: [] };
      const allE = await entities
        .get({})
        .sort('-_id')
        .limit(maxUpload)
        .exec();
      await allE.reduce(async (prom, e: WithId<EntitySchema>) => {
        await prom;
        if (!e.template || !e.metadata) {
          return;
        }
        const seqMeta = e.metadata[seqPropName];
        if (!seqMeta || !seqMeta.length || !seqMeta[0].value) {
          return;
        }
        const prop = templateAndProp[e.template.toString()];
        if (!prop) {
          return;
        }
        const propMeta = e.metadata[prop] || [];
        request.samples.push({
          seq: seqMeta[0].value,
          training_labels: propMeta.map(mo => ({
            topic: mo.label,
          })),
        });
        if (request.samples.length >= 2000) {
          process.stdout.write('.');
          await storeSamples(request, modelName);
          process.stdout.write('+');
          request.samples = [];
        }
      }, Promise.resolve());
      if (request.samples.length > 0) {
        process.stdout.write('!');
        await storeSamples(request, modelName);
        request.samples = [];
        process.stdout.write('+');
      }
      process.stdout.write('\n');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
  return disconnect();
});
