/**
 * Topic Classification client.
 */
/* eslint-disable camelcase */

import {
  IsTopicClassificationReachable,
  RPC_DEADLINE_MS,
  tcServer,
} from 'api/config/topicClassification';
import search from 'api/search/search';
import templates from 'api/templates';
import { extractSequence } from 'api/topicclassification/common';
import { ClassifierModelSchema } from 'app/Thesauri/types/classifierModelType';
import 'isomorphic-fetch';
import { buildFullModelName } from 'shared/commonTopicClassification';
import request from 'shared/JSONRequest';
import { TaskStatus } from 'shared/tasks/tasks';
import { EntitySchema } from 'shared/types/entityType';
import { URL } from 'url';
import util from 'util';
import { getThesaurusPropertyNames } from '../../shared/commonTopicClassification';
import { ThesaurusSchema, ThesaurusValueSchema } from '../../shared/types/thesaurusType';

const MODELS_LIST_ENDPOINT = 'models/list';
const MODEL_GET_ENDPOINT = 'models';
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
    const response = await request.get(tcUrl.href);
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
  const response = await request.get(tcUrl.href);
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

export async function getTaskState(task: string): Promise<TaskStatus> {
  const tcUrl = new URL(TASKS_ENDPOINT, tcServer);
  tcUrl.searchParams.set('name', task);
  if (!(await IsTopicClassificationReachable())) {
    return { state: 'undefined', result: {} };
  }
  const response = await request.get(tcUrl.href);
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

export async function getTrainStateForThesaurus(thesaurusName: string = '') {
  return getTaskState(`train-${buildFullModelName(thesaurusName)}`);
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
        if (!e.metadata || !e.metadata[propNames[0]]?.length) {
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
  const response = await request.post(tcUrl.href, reqData);
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
