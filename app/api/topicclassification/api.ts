/**
 * @format
 * Topic Classification client.
 */

import 'isomorphic-fetch';
import isReachable from 'is-reachable';
import { tcServer } from 'api/config/topicClassification';
import { URL } from 'url';
import request from 'shared/JSONRequest';
import { ClassifierModelSchema } from 'app/Thesauri/types/classifierModelType';

const RPC_DEADLINE_MS = 1000;
const MODELS_LIST_ENDPOINT = 'models/list';
const MODEL_GET_ENDPOINT = 'models';

export async function listModels(
  filter: string = `^${process.env.DATABASE_NAME}`
): Promise<{ models: string[]; error: string }> {
  const tcUrl = new URL(MODELS_LIST_ENDPOINT, tcServer);
  if (!(await isReachable(tcUrl.href, { timeout: RPC_DEADLINE_MS }))) {
    // TODO: move this backend check to server start-up time, maybe
    return Promise.resolve({
      models: [],
      error: `Topic Classification server is unreachable (waited ${RPC_DEADLINE_MS} ms)`,
    });
  }

  try {
    tcUrl.searchParams.set('filter', filter);
    const response = await request.get(tcUrl.href);
    return response.json;
  } catch (err) {
    return Promise.resolve({
      models: [],
      error: `Error from topic-classification server: ${err.toString()}`,
    });
  }
}

export async function getModel(arg: { model: string }): Promise<ClassifierModelSchema> {
  const tcUrl = new URL(MODEL_GET_ENDPOINT, tcServer);
  tcUrl.searchParams.set('model', arg.model);
  if (!(await isReachable(tcUrl.href, { timeout: RPC_DEADLINE_MS }))) {
    // TODO: move this backend check to server start-up time, maybe
    return Promise.reject(
      new Error(`Topic Classification server is unreachable (waited ${RPC_DEADLINE_MS} ms)`)
    );
  }
  try {
    const response = await request.get(tcUrl.href);
    return response.json as ClassifierModelSchema;
  } catch (err) {
    return Promise.reject(new Error(`Error from topic-classification server: ${err.toString()}`));
  }
}
