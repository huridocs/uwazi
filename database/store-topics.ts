/** @format */
/* eslint-disable no-await-in-loop, no-console */

import { useThesaurusNames, tcServer } from 'api/config/topicclassification';
import entities from 'api/entities';
import { WithId, QueryForEach } from 'api/odm';
import templates from 'api/templates';
import thesauri from 'api/thesauris';
import { buildModelName } from 'shared/commonTopicClassification';
import { extractSequence } from 'api/topicclassification/common';
import connect, { disconnect } from 'api/utils/connect_to_mongo';
import JSONRequest from 'shared/JSONRequest';
import yargs from 'yargs';
import { EntitySchema } from '../app/api/entities/entityType';
import { ThesaurusSchema } from '../app/api/thesauris/dictionariesType';

const { max_upload: maxUpload } = yargs.option('max_upload', { default: 1000000 }).help().argv;

async function storeSamples(request: any, model: string) {
  const response = await JSONRequest.post(
    `${tcServer}/classification_sample?model=${model}`,
    request
  );
  if (response.status !== 200) {
    console.error(response);
  }
}

connect().then(
  async () => {
    try {
      if (!process.env.DATABASE_NAME) {
        throw new Error('You need to set $DATABASE_NAME!');
      }
      const allThesauri: WithId<ThesaurusSchema>[] = await thesauri.get();
      const allTemplates = await templates.get();
      await allThesauri
        .filter(t => t.enable_classification)
        .reduce(async (prom, selectedThesaurus) => {
          await prom;
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

          process.stdout.write(selectedThesaurus.name);
          const modelName = buildModelName(selectedThesaurus.name);
          const request: any = { samples: [] };
          await QueryForEach(
            entities
              .get({})
              .sort('-_id')
              .limit(maxUpload),
            2000,
            async (e: WithId<EntitySchema>) => {
              if (!e.template || !e.metadata) {
                return;
              }
              const sequence = await extractSequence(e);
              if (!sequence) {
                return;
              }
              const prop = templateAndProp[e.template.toString()];
              if (!prop) {
                return;
              }
              const propMeta = e.metadata[prop] || [];
              request.samples.push({
                seq: sequence,
                training_labels: propMeta.map(mo => ({
                  topic: useThesaurusNames ? mo.label : mo.value,
                })),
              });
              if (request.samples.length >= 2000) {
                process.stdout.write('.');
                await storeSamples(request, modelName);
                process.stdout.write('+');
                request.samples = [];
              }
            }
          );
          if (request.samples.length > 0) {
            process.stdout.write('!');
            await storeSamples(request, modelName);
            request.samples = [];
            process.stdout.write('+');
          }
          process.stdout.write('\n');
        }, Promise.resolve());
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
    return disconnect();
  },
  () => {}
);
