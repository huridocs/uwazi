/* eslint-disable no-await-in-loop,camelcase,max-lines */
import 'isomorphic-fetch';
import {
  IsTopicClassificationReachable,
  RPC_DEADLINE_MS,
  tcServer,
} from 'api/config/topicClassification';
import { search } from 'api/search';
import templates from 'api/templates';
import { extractSequence } from 'api/topicclassification/common';
import { ClassifierModelSchema } from 'app/Thesauri/types/classifierModelType';
import { buildFullModelName, getThesaurusPropertyNames } from 'shared/commonTopicClassification';
import JSONRequest from 'shared/JSONRequest';
import { propertyTypes } from 'shared/propertyTypes';
import { provenanceTypes } from 'shared/provenanceTypes';
import { TaskStatus } from 'shared/tasks/tasks';
import { sleep } from 'shared/tsUtils';
import { PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { ThesaurusSchema, ThesaurusValueSchema } from 'shared/types/thesaurusType';
import { URL } from 'url';
import util from 'util';
import { MetadataObject } from '../entities/entitiesModel';

const MODELS_LIST_ENDPOINT = 'models/list';
const MODEL_GET_ENDPOINT = 'models';
const CLASSIFY_ENDPOINT = 'classify';
const TASKS_ENDPOINT = 'task';

export async function listModels(
  filter: string = `^${process.env.DATABASE_NAME}`
): Promise<{ models: string[]; error: string }> {
  const tcUrl = new URL(MODELS_LIST_ENDPOINT, tcServer);
  if (!(await IsTopicClassificationReachable())) {
    return {
      models: [],
      error: `Topic Classification server is unreachable (waited ${RPC_DEADLINE_MS} ms)`,
    };
  }

  try {
    tcUrl.searchParams.set('filter', filter);
    const response = await JSONRequest.get(tcUrl.href);
    if (response.status !== 200) {
      throw new Error(`Backend returned ${response.status}.`);
    }
    return response.json;
  } catch (err) {
    return {
      models: [],
      error: `Error from topic-classification server: ${util.inspect(err, false, null)}`,
    };
  }
}

export async function getModel(model: string): Promise<ClassifierModelSchema> {
  if (!(await IsTopicClassificationReachable())) {
    throw new Error(`Topic Classification server is unreachable (waited ${RPC_DEADLINE_MS} ms)`);
  }
  const tcUrl = new URL(MODEL_GET_ENDPOINT, tcServer);
  tcUrl.searchParams.set('model', model);
  const response = await JSONRequest.get(tcUrl.href);
  return response.json as ClassifierModelSchema;
}

export async function getModelForThesaurus(
  thesaurusName: string = ''
): Promise<ClassifierModelSchema> {
  const modelFilter = buildFullModelName(thesaurusName);
  const resultModelNames = await listModels(modelFilter);

  let model: ClassifierModelSchema;
  // we only expect one result, since we've filtered by model already
  switch (resultModelNames.models.length) {
    case 0:
      return { name: '', topics: {} };
    case 1:
      model = await getModel(resultModelNames.models[0]);
      model.name = thesaurusName;
      return model;
    default:
      throw new Error(
        `Expected one model to exist on the topic classification server but instead there were ${resultModelNames.models.length}.`
      );
  }
}

export async function getTaskStatus(task: string): Promise<TaskStatus> {
  const tcUrl = new URL(TASKS_ENDPOINT, tcServer);
  tcUrl.searchParams.set('name', task);
  if (!(await IsTopicClassificationReachable())) {
    return { state: 'undefined', result: {} };
  }
  const response = await JSONRequest.get(tcUrl.href);
  if (response.status === 404) {
    return { state: 'undefined', result: {} };
  }
  if (response.status !== 200) {
    throw new Error(response.toString());
  }
  const pyTask = response.json;
  return {
    state: pyTask.state,
    startTime: pyTask.start_time,
    endTime: pyTask.end_time,
    message: pyTask.status,
    result: {},
  };
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
  model: string,
  request: ClassifyRequest
): Promise<ClassifyResponse | null> {
  if (!(await IsTopicClassificationReachable())) {
    return null;
  }
  const tcUrl = new URL(CLASSIFY_ENDPOINT, tcServer);
  tcUrl.searchParams.set('model', model);
  let response: ClassifyResponse = { json: { samples: [] }, status: 0 };
  let lastErr;
  for (let i = 0; i < 10; i += 1) {
    lastErr = undefined;
    try {
      response = await JSONRequest.post(tcUrl.href, request);
      if (response.status === 200) {
        break;
      }
    } catch (err) {
      lastErr = err;
    }
    await sleep(523);
  }
  if (lastErr) {
    throw lastErr;
  }
  if (response.status !== 200) {
    return null;
  }
  return response;
}

export async function fetchSuggestions(
  e: EntitySchema,
  prop: PropertySchema,
  seq: string,
  thes: ThesaurusSchema
) {
  const model = buildFullModelName(thes.name);
  const request = { refresh_predictions: true, samples: [{ seq, sharedId: e.sharedId }] };
  const response = await sendSample(model, request);
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

export async function getTrainStateForThesaurus(thesaurusName: string = '') {
  return getTaskStatus(`train-${buildFullModelName(thesaurusName)}`);
}

export async function startTraining(thesaurus: ThesaurusSchema) {
  if (!(await IsTopicClassificationReachable())) {
    throw new Error(`Topic Classification server is unreachable (waited ${RPC_DEADLINE_MS} ms)`);
  }
  const flattenValues = thesaurus.values!.reduce(
    (result, dv) => (dv.values ? result.concat(dv.values) : result.concat([dv])),
    [] as ThesaurusValueSchema[]
  );
  const propNames = getThesaurusPropertyNames(thesaurus._id!.toString(), await templates.get(null));
  if (propNames.length !== 1) {
    throw new Error(
      `Training with thesaurus ${thesaurus.name} is not possible since it's used in mismatching templates fields ${propNames}!`
    );
  }
  const searchQuery = {
    filters: { [propNames[0]]: { values: ['any'] } },
    includeUnpublished: true,
    limit: 2000,
  };
  const trainingData = await search.search(searchQuery, 'en', 'internal');
  const testSamples = Math.min(
    trainingData.rows.length / 2,
    flattenValues.length * 15 + trainingData.rows.length * 0.05
  );
  const reqData = {
    provider: 'TrainModel',
    name: `train-${buildFullModelName(thesaurus.name)}`,
    model: buildFullModelName(thesaurus.name),
    labels: flattenValues.map(v => v.label),
    num_train_steps: 3000,
    train_ratio: 1.0 - testSamples / trainingData.rows.length,
    samples: await trainingData.rows.reduce(
      async (res: Promise<{ seq: string; training_labels: string[] }[]>, e: EntitySchema) => {
        if (
          !e.metadata ||
          !e.metadata[propNames[0]]?.length ||
          e.metadata[propNames[0]]?.some(v => v.provenance === provenanceTypes.bulk)
        ) {
          return res;
        }
        return [
          ...(await res),
          {
            seq: await extractSequence(e),
            training_labels: e.metadata[propNames[0]]!.map(v => v.label),
          },
        ];
      },
      []
    ),
  };
  const tcUrl = new URL(TASKS_ENDPOINT, tcServer);
  const response = await JSONRequest.post(tcUrl.href, reqData);
  if (response.status !== 200) {
    return { state: 'undefined', result: {} };
  }
  const pyTask = response.json;
  return {
    state: pyTask.state,
    startTime: pyTask.start_time,
    endTime: pyTask.end_time,
    message: pyTask.status,
    result: {},
  };
}
