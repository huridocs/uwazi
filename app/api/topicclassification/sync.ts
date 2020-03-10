/* eslint-disable no-await-in-loop,camelcase,max-lines */
import { tcServer } from 'api/config/topicClassification';
import entities from 'api/entities';
import { MetadataObject } from 'api/entities/entitiesModel';
import { EntitySchema } from 'api/entities/entityType';
import { QueryForEach, WithId } from 'api/odm';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import { extractSequence, listModels } from 'api/topicclassification';
import { buildFullModelName } from 'shared/commonTopicClassification';
import JSONRequest from 'shared/JSONRequest';
import { propertyTypes } from 'shared/propertyTypes';
import { Task, TaskProvider } from 'shared/tasks/tasks';
import { sleep } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import * as util from 'util';
import { getModel } from 'api/topicclassification/api';

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
};

type ClassifyRequest = {
  samples: ClassificationSample[];
};

type ClassifyResponse = {
  json: {
    samples?: {
      sharedId: string;
      predicted_labels: { topic: string; quality: number }[];
      model_version?: string;
    }[];
  };
  status: any;
};

async function sendSample(
  path: string,
  request: ClassifyRequest
): Promise<ClassifyResponse | null> {
  let response: ClassifyResponse = { json: { samples: [] }, status: 0 };
  let lastErr;
  for (let i = 0; i < 10; i += 1) {
    lastErr = undefined;
    try {
      response = await JSONRequest.post(path, request);
      if (response.status === 200) {
        break;
      }
    } catch (err) {
      lastErr = err;
    }
    // console.error(`Attempt ${i} failed: ${response.status} ${lastErr}`);
    await sleep(523);
  }
  if (lastErr) {
    throw lastErr;
  }
  if (response.status !== 200) {
    // console.error(response);
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
  const response = await sendSample(`${tcServer}/classify?model=${model}`, request);
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
        if (pred.topic === 'nan') {
          return res;
        }
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
  thes: ThesaurusSchema,
  latestModelVersion?: string
): Promise<boolean> {
  const seq = await extractSequence(e);
  if (args.mode === 'onlynew') {
    if (e.metadata![prop.name!] && (e.metadata![prop.name!] ?? []).length) {
      return false;
    }
    if (!args.overwrite && e.suggestedMetadata![prop.name!]) {
      return false;
    }
    if (latestModelVersion) {
      const currentModel = e
        .suggestedMetadata![prop.name!]?.map(v => v.suggestion_model)
        .reduce((max, s) => ((s || '') > max! ? s : max), '');
      if (currentModel && currentModel >= latestModelVersion) {
        return false;
      }
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
  thesaurusDictP?: { [k: string]: ThesaurusSchema },
  availableModels?: { [k: string]: string | undefined }
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
      if (!prop || !thesaurus) {
        return;
      }
      const modelName = buildFullModelName(thesaurus.name);
      if (availableModels !== undefined && !availableModels[modelName]) {
        return;
      }
      didSth =
        didSth || (await handleProp(e, args, prop, thesaurus, (availableModels ?? {})[modelName]));
    })
  );
  return didSth;
}

async function getAvailableModels(fixedModel?: string) {
  const models = (await listModels()) ?? { error: 'Internal error in calling backend.' };
  if (models.error) {
    return { error: `Aborted: ${models.error}` };
  }
  return models.models.reduce(async (res, m) => {
    if (fixedModel && m !== fixedModel) {
      return res;
    }
    const model = await getModel(m);
    if (model && model.preferred) {
      return { ...(await res), [m]: model.preferred };
    }
    return res;
  }, Promise.resolve({} as { [k: string]: string | undefined; error?: string }));
}

class SyncTask extends Task {
  protected async run(args: SyncArgs) {
    this.status.message = `Started with ${util.inspect(args)}`;
    const models = await getAvailableModels(args.model);
    if (models.error) {
      this.status.message = models.error;
      return;
    }
    const templatesDict = (await templates.get(null)).reduce(
      (res, t) => ({ ...res, [t._id.toString()]: t }),
      {}
    );
    const thesaurusDict = (await thesauri.get(null)).reduce(
      (res, t) => ({ ...res, [t._id.toString()]: t }),
      {} as { [k: string]: ThesaurusSchema }
    );
    if (!Object.keys(models).length) {
      this.status.message = 'Aborted: Topic Classification server does not have any models!';
      return;
    }
    const res = this.status.result;
    res.total = await entities.count({ language: 'en' });
    res.seen = 0;
    res.index = 0;
    await QueryForEach(
      entities.get({ language: 'en' }).sort('_id'),
      50,
      async (e: WithId<EntitySchema>) => {
        if (res.index > (args.limit ?? 1000000)) {
          return;
        }
        res.seen += 1;
        if (await syncEntity(e, args, templatesDict, thesaurusDict, models)) {
          res.index += 1;
          if (args.noDryRun) {
            await entities.save(e, { user: 'sync-topic-classification', language: e.language });
          }
        }
        this.status.message =
          `${res.seen} of ${res.total} documents processed, ` +
          `${res.index} changed. Sync arguments are ${util.inspect(args)}.`;
      }
    );
  }
}

TaskProvider.registerClass('TopicClassificationSync', SyncTask);
