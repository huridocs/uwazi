/** @format */
/* eslint-disable no-await-in-loop, no-console */

import { tcServer, useThesaurusNames } from 'api/config/topicclassification';
import entities from 'api/entities';
import { QueryForEach, WithId } from 'api/odm';
import templates from 'api/templates';
import thesauri from 'api/thesauris';
import { extractSequence } from 'api/topicclassification/common';
import connect, { disconnect } from 'api/utils/connect_to_mongo';
import { buildModelName } from 'shared/commonTopicClassification';
import JSONRequest from 'shared/JSONRequest';
import yargs from 'yargs';
import { MetadataObject } from '../app/api/entities/entitiesModel';
import { EntitySchema } from '../app/api/entities/entityType';
import { ThesaurusSchema } from '../app/api/thesauris/dictionariesType';

const { limit } = yargs.option('limit', { default: 1000000 }).help().argv;

async function syncEntity(
  e: WithId<EntitySchema>,
  prop: string,
  model: string,
  thesaurus: ThesaurusSchema
) {
  if (!e.template || !e.metadata || e.language !== 'en' || !prop) {
    return false;
  }
  const sequence = await extractSequence(e);
  if (!sequence) {
    return false;
  }
  const propMeta = e.metadata[prop] || [];
  const request = {
    samples: [
      {
        seq: sequence,
        training_labels: propMeta.map(mo => ({
          topic: useThesaurusNames ? mo.label : mo.value,
        })),
      },
    ],
  };
  const response = await JSONRequest.put(
    `${tcServer}/classification_sample?model=${model}`,
    request
  );
  if (response.status !== 200) {
    console.error(response);
    return false;
  }
  if (
    response.json.samples &&
    response.json.samples.length &&
    response.json.samples[0].seq === sequence
  ) {
    if (!e.suggestedMetadata) {
      e.suggestedMetadata = {};
    }
    e.suggestedMetadata[prop] = response.json.samples[0].predicted_labels.reduce(
      (res: MetadataObject<string>[], pred: { topic: string; quality: number }) => {
        const thesValue = (thesaurus.values || []).find(v => v.label === pred.topic);
        if (!thesValue) {
          console.error(
            `Model prediction "${pred.topic}" not found in thesaurus ${thesaurus.name}`
          );
          return res;
        }
        return [
          ...res,
          { value: thesValue.id, label: pred.topic, suggestion_confidence: pred.quality },
        ];
      },
      []
    );
    await entities.save(e, { user: 'sync-topic-classification', language: e.language });
    console.info(`Saved ${e.sharedId}`);
  }
  return true;
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

          const modelName = buildModelName(selectedThesaurus.name);

          let index = 0;
          await QueryForEach(
            entities
              .get({})
              .sort('-_id')
              .limit(limit),
            1000,
            async (e: WithId<EntitySchema>) => {
              const didSomething = await syncEntity(
                e,
                templateAndProp[(e.template || '').toString()],
                modelName,
                selectedThesaurus
              );
              if (didSomething) {
                index += 1;
                if (index % 100 === 0) {
                  process.stdout.write(
                    `${selectedThesaurus.name}: syncronized entities -> ${index}\r`
                  );
                }
              }
            }
          );
          process.stdout.write(`${selectedThesaurus.name}: syncronized entities -> ${index}\n`);
        }, Promise.resolve());
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
    return disconnect();
  },
  () => {}
);
