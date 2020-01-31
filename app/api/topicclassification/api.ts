/** @format */

import 'isomorphic-fetch';
import isReachable from 'is-reachable';
import { tcServer } from 'api/config/topicClassification';
import { URL } from 'url';
import request from 'shared/JSONRequest';

export async function getModels() {
  const tcUrl = new URL('models', tcServer);
  const msTimeout = 1000;
  if (!(await isReachable(tcUrl.href, { timeout: msTimeout }))) {
    // TODO: move this backend check to server start-up time, maybe
    return {
      models: {},
      error: `Topic Classification server is unreachable (${msTimeout})`,
    };
  }
  return request
    .get(tcUrl.href)
    .then(async res => res.json)
    .catch(err => ({
      models: {},
      error: `Error from topic-classification server: ${err.toString()}`,
    }));
}

export async function checkModelReady(arg: { model: string }) {
  const tcUrl = new URL('models', tcServer);
  tcUrl.searchParams.set('model', arg.model);
  const msTimeout = 1000;
  if (!(await isReachable(tcUrl.href, { timeout: msTimeout }))) {
    // TODO: move this backend check to server start-up time, maybe
    return { models: {}, error: `Topic Classification server is unreachable (${msTimeout})` };
  }
  return request
    .get(tcUrl.href)
    .then(async res => res.json)
    .catch(err => ({
      models: '',
      error: `Error from topic-classification server: ${err.toString()}`,
    }));
}
