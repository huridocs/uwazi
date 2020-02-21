// eslint-disable-line max-lines
/* eslint-disable no-await-in-loop, no-console, camelcase */
import * as util from 'util';
import { tcServer } from 'api/config/topicClassification';
import entities from 'api/entities';
import { MetadataObject } from 'api/entities/entitiesModel';
import { EntitySchema } from 'api/entities/entityType';
import { QueryForEach, WithId } from 'api/odm';
import { Task, TaskProvider } from 'api/tasks/tasks';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import { extractSequence } from 'api/topicclassification/common';
import { buildFullModelName } from 'shared/commonTopicClassification';
import JSONRequest from 'shared/JSONRequest';
import { propertyTypes } from 'shared/propertyTypes';
import { sleep } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { TemplateSchema } from '../../shared/types/templateType';
import { ThesaurusValueSchema } from '../../shared/types/thesaurusType';

export interface SyncArgs {
  limit?: number;
  mode: 'onlynew' | 'autoaccept';
  model?: string;
  noDryRun?: boolean;
  overwrite?: boolean;
  autoAcceptConfidence?: number;
}

type ClassificationSample = {
  seq: string;
  sharedId: string | undefined;
  training_labels?: {
    topic: string;
  }[];
};

type ClassificationSampleRequest = {
  refresh_predictions: boolean;
  samples: ClassificationSample[];
};

type ClassificationSampleResponse = {
  json: {
    samples: {
      sharedId: string;
      predicted_labels: { topic: string; quality: number }[];
      model_version?: number;
    }[];
  };
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

async function fetchSuggestions(
  e: EntitySchema,
  prop: PropertySchema,
  seq: string,
  thes: ThesaurusSchema
) {
  const model = buildFullModelName(thes.name);
  const request = { refresh_predictions: true, samples: [{ seq, sharedId: e.sharedId }] };
  const response = await sendSample(`${tcServer}/classification_sample?model=${model}`, request);
  const sample = response?.json?.samples?.find(s => s.sharedId === e.sharedId);
  if (!sample) {
    return null;
  }
  let newPropMetadata = sample.predicted_labels
    .reduce((res: MetadataObject<string>[], pred) => {
      const flattenValues = (thes.values ?? []).reduce(
        (result, dv) => (dv.values ? result.concat(dv.values) : result.concat([dv])),
        [] as ThesaurusValueSchema[]
      );
      const thesValue = flattenValues.find(v => v.label === pred.topic || v.id === pred.topic);
      if (!thesValue || !thesValue.id) {
        throw Error(`Model suggestion "${pred.topic}" not found in thesaurus ${thes.name}`);
      }
      return [
        ...res,
        {
          value: thesValue.id,
          label: thesValue.label,
          suggestion_confidence: pred.quality,
          suggestion_model: sample.model_version,
        },
      ];
    }, [])
    .sort((v1, v2) => (v2.suggestion_confidence || 0) - (v1.suggestion_confidence || 0));
  if (prop.type === propertyTypes.select && newPropMetadata.length) {
    newPropMetadata = [newPropMetadata[0]];
  }
  return newPropMetadata;
}

async function handleProp(
  e: EntitySchema,
  args: SyncArgs,
  prop: PropertySchema,
  thes: ThesaurusSchema
): Promise<boolean> {
  const seq = await extractSequence(e);
  if (args.mode === 'onlynew') {
    if (e.metadata![prop.name!] && (e.metadata![prop.name!] ?? []).length) {
      return false;
    }
    if (!args.overwrite && e.suggestedMetadata![prop.name!]) {
      return false;
    }
    const suggestions = await fetchSuggestions(e, prop, seq, thes);
    if (
      !suggestions ||
      JSON.stringify(suggestions) === JSON.stringify(e.suggestedMetadata![prop.name!])
    ) {
      return false;
    }
    e.suggestedMetadata![prop.name!] = suggestions;
    return true;
  }
  return false;
}

export async function syncEntity(
  e: EntitySchema,
  args: SyncArgs,
  templateDictP?: { [k: string]: TemplateSchema },
  thesaurusDictP?: { [k: string]: ThesaurusSchema }
): Promise<boolean> {
  if (!e.metadata) {
    e.metadata = {};
  }
  if (!e.suggestedMetadata) {
    e.suggestedMetadata = {};
  }
  const template: TemplateSchema =
    (templateDictP ?? {})[e.template?.toString() ?? ''] ?? (await templates.getById(e.template));
  const thesaurusDict =
    thesaurusDictP ??
    (await thesauri.get(null)).reduce((res, t) => ({ ...res, [t._id.toString()]: t }), {});
  let didSth = false;
  await Promise.all(
    (template.properties ?? []).map(async prop => {
      const thesaurus = thesaurusDict[prop?.content ?? ''];
      if (!prop || !thesaurus || !thesaurus.enable_classification) {
        return;
      }
      didSth = didSth || (await handleProp(e, args, prop, thesaurus));
    })
  );
  return didSth;
}

class SyncTask extends Task {
  protected async run(args: SyncArgs) {
    this.status.message = `Started with ${util.inspect(args)}`;
    const templatesDict = (await templates.get(null)).reduce(
      (res, t) => ({ ...res, [t._id.toString()]: t }),
      {}
    );
    const thesaurusDict = (await thesauri.get(null)).reduce(
      (res, t) => ({ ...res, [t._id.toString()]: t }),
      {}
    );
    let seen = 0;
    let index = 0;
    await QueryForEach(
      entities.get({ language: 'en' }).sort('_id'),
      50,
      async (e: WithId<EntitySchema>) => {
        if (index > (args.limit ?? 1000000)) {
          return;
        }
        seen += 1;
        if (await syncEntity(e, args, templatesDict, thesaurusDict)) {
          index += 1;
          if (args.noDryRun) {
            await entities.save(e, { user: 'sync-topic-classification', language: e.language });
          }
        }
        this.status.message = `Running with ${util.inspect(args)}: ${seen} seen, ${index} changed`;
      }
    );
  }
}

TaskProvider.registerClass('TopicClassificationSync', SyncTask);
