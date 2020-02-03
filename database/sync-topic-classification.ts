/** @format */ // eslint-disable-line max-lines
/* eslint-disable no-await-in-loop, no-console, camelcase */
import { tcServer, useThesaurusNames } from 'api/config/topicClassification';
import entities from 'api/entities';
import { MetadataObject } from 'api/entities/entitiesModel';
import { EntitySchema } from 'api/entities/entityType';
import { QueryForEach, WithId } from 'api/odm';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import { extractSequence } from 'api/topicclassification/common';
import connect, { disconnect } from 'api/utils/connect_to_mongo';
import { buildModelName } from 'shared/commonTopicClassification';
import JSONRequest from 'shared/JSONRequest';
import { propertyTypes } from 'shared/propertyTypes';
import { ensure, sleep } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import yargs from 'yargs';

const { limit, recompute, overwrite, mode, model: fixedModel, sharedIds: sharedIdsStr } = yargs
  .option('limit', { default: 1000000 })
  .option('recompute', {
    default: false,
    usage: 'If true, force topic-classification to refresh all predictions. Can be slow.',
  })
  .option('overwrite', {
    default: false,
    usage:
      'If true, replace suggestedMetadata in Uwazi with predictions, even if ' +
      'suggestions exist. This potentially recreates previously-rejected suggestions.',
  })
  .option('mode', {
    default: 'onlynew',
    usage:
      'onlynew: only process entities that have no value for the thesaurus; ' +
      'all: process all entities; ' +
      'purge: delete suggestions;',
  })
  .option('sharedIds', { default: '' })
  .option('model', {
    default: '',
    usage: 'If set, only run on this model.',
  })
  .help().argv;

const sharedIds = sharedIdsStr ? sharedIdsStr.split(',') : [];

type ClassificationSample = {
  seq: string;
  sharedId: string | undefined;
  training_labels: {
    topic: string;
  }[];
};

type ClassificationSampleRequest = {
  refresh_predictions: boolean;
  samples: ClassificationSample[];
};

type ClassificationSampleResponse = {
  json: { samples: { sharedId: string; predicted_labels: { topic: string; quality: number }[] }[] };
  status: any;
};

async function sendSample(
  path: string,
  request: ClassificationSampleRequest
): Promise<ClassificationSampleResponse | null> {
  let response: ClassificationSampleResponse = { json: { samples: [] }, status: 0 };
  let lastErr;
  for (let i = 0; i < 10; i += 1) {
    lastErr = undefined;
    try {
      response = await JSONRequest.put(path, request);
      if (response.status === 200) {
        break;
      }
    } catch (err) {
      lastErr = err;
    }
    console.error(`Attempt ${i} failed: ${response.status} ${lastErr}`);
    await sleep(523);
  }
  if (lastErr) {
    throw lastErr;
  }
  if (response.status !== 200) {
    console.error(response);
    return null;
  }
  return response;
}

async function handleResponse(
  e: WithId<EntitySchema>,
  templateAndProp: any,
  response: ClassificationSampleResponse,
  thesaurus: ThesaurusSchema
) {
  const prop = templateAndProp[(e.template || '').toString()];
  if (!prop || !prop.name) {
    console.error(`Missing prop for ${e.sharedId}`);
    return false;
  }
  const sample = response.json.samples.find(s => s.sharedId === e.sharedId);
  if (!sample) {
    console.error(`Missing response for ${e.sharedId}`);
    return false;
  }
  if (!e.suggestedMetadata) {
    e.suggestedMetadata = {};
  }
  if (!sample.predicted_labels.length) {
    console.error(`No predictions for ${e.sharedId}`);
  }
  // We explicitely preserve empty arrays in suggestedMetadata to not
  // recreate rejected suggestions.
  if (!e.suggestedMetadata[prop.name] || overwrite) {
    let newPropMetadata = sample.predicted_labels
      .reduce((res: MetadataObject<string>[], pred) => {
        const thesValue = (thesaurus.values || []).find(v => v.label === pred.topic);
        if (!thesValue || !thesValue.id) {
          console.error(
            `Model prediction "${pred.topic}" not found in thesaurus ${thesaurus.name}`
          );
          return res;
        }
        return [
          ...res,
          { value: thesValue.id, label: pred.topic, suggestion_confidence: pred.quality },
        ];
      }, [])
      .sort((v1, v2) => (v2.suggestion_confidence || 0) - (v1.suggestion_confidence || 0));
    if (prop.type === propertyTypes.select && newPropMetadata.length) {
      newPropMetadata = [newPropMetadata[0]];
    }
    // JSON.stringify provides an easy and fast deep-equal comparison.
    if (JSON.stringify(newPropMetadata) !== JSON.stringify(e.suggestedMetadata[prop.name])) {
      e.suggestedMetadata[prop.name] = newPropMetadata;
      await entities.save(e, { user: 'sync-topic-classification', language: e.language });
      console.info(`Saved ${e.sharedId}`);
    }
  }
  return true;
}

async function syncEntities(
  es: WithId<EntitySchema>[],
  templateAndProp: any,
  model: string,
  thesaurus: ThesaurusSchema
) {
  if (mode === 'purge') {
    return (
      await Promise.all(
        es.map(async e => {
          const prop = templateAndProp[(e.template || '').toString()];
          if (!prop || !prop.name) {
            return false;
          }
          const suggestedMetadata = e.suggestedMetadata || {};
          if (!suggestedMetadata[prop.name!]) {
            return false;
          }
          delete e.suggestedMetadata![prop.name!];
          await entities.save(e, { user: 'sync-topic-classification', language: e.language });
          console.info(`Purged ${e.sharedId}`);
          return true;
        })
      )
    ).reduce((sum, b) => sum + (b ? 1 : 0), 0);
  }
  const samples = (
    await Promise.all(
      es.map(async e => {
        const prop = templateAndProp[(e.template || '').toString()];
        if (!prop || !prop.name) {
          return null;
        }

        if (!e.template || !e.metadata || e.language !== 'en') {
          return null;
        }
        if (mode === 'onlynew') {
          if (e.metadata[prop.name!] && e.metadata[prop.name!]!.length) {
            return null;
          }
        }
        const sequence = await extractSequence(e);
        if (!sequence) {
          return null;
        }
        return {
          seq: sequence,
          sharedId: e.sharedId,
          training_labels: (e.metadata[prop.name!] || []).map(mo => ({
            topic: ensure<string>(useThesaurusNames ? mo.label : mo.value),
          })),
        } as ClassificationSample;
      })
    )
  ).reduce((res, s) => (s ? [...res, s] : res), [] as ClassificationSample[]);
  if (!samples.length) {
    return 0;
  }
  const request = {
    refresh_predictions: recompute,
    samples,
  };
  const response = await sendSample(`${tcServer}/classification_sample?model=${model}`, request);
  if (!response || !response.json.samples) {
    console.error(`Failed request for ${request.samples.map(s => s.sharedId)}`);
    return 0;
  }
  return (
    await Promise.all(es.map(async e => handleResponse(e, templateAndProp, response, thesaurus)))
  ).reduce((sum, b) => sum + (b ? 1 : 0), 0);
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
          const templateAndProp = allTemplates.reduce((res: { [k: string]: PropertySchema }, t) => {
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
              [t._id.toString()]: thesProp,
            };
          }, {});

          const modelName = buildModelName(selectedThesaurus.name);
          if (fixedModel && modelName !== fixedModel) {
            console.log(`Skipped ${modelName}.`);
            return;
          }

          let index = 0;
          let batch = [] as WithId<EntitySchema>[];
          await QueryForEach(
            entities.get({ language: 'en' }).sort('_id'),
            300,
            async (e: WithId<EntitySchema>) => {
              if (index > limit) {
                return;
              }
              if (sharedIds.length && !sharedIds.includes(e.sharedId || '')) {
                return;
              }
              batch.push(e);
              if (batch.length >= 200) {
                const runNow = [...batch];
                batch = [];
                const done = await syncEntities(
                  runNow,
                  templateAndProp,
                  modelName,
                  selectedThesaurus
                );
                if (done) {
                  index += done;
                  process.stdout.write(
                    `${selectedThesaurus.name}: syncronized entities -> ${index}\n`
                  );
                }
              }
            }
          );
          if (batch.length > 0) {
            index += await syncEntities(batch, templateAndProp, modelName, selectedThesaurus);
            process.stdout.write(`${selectedThesaurus.name}: syncronized entities -> ${index}\n`);
          }
        }, Promise.resolve());
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
    return disconnect();
  },
  () => {}
);
