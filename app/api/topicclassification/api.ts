/** @format */

import 'isomorphic-fetch';
import isReachable from 'is-reachable';
import { tcServer } from 'api/config/topicclassification';
import { URL } from 'url';

export async function getModels() {
  const tcUrl = new URL('models', tcServer);
  const msTimeout = 1000;
  if (!(await isReachable(tcUrl.href, { timeout: msTimeout }))) {
    // TODO: move this backend check to server start-up time, maybe
    return JSON.stringify({
      models: {},
      error: `Topic Classification server is unreachable (${msTimeout})`,
    });
  }
  return fetch(tcUrl.href, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(async res => res.json())
    .catch(err =>
      JSON.stringify({
        models: {},
        error: `Error from topic-classification server: ${err.toString()}`,
      })
    );
}

export async function checkModelReady(arg: { model: string }) {
  const tcUrl = new URL('models', tcServer);
  tcUrl.searchParams.set('model', arg.model);
  const res = await fetch(tcUrl.href, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const body = await res.json();
  return body;
}

export async function processDocument(arg: { seq: string; model: string }) {
  const url = new URL(tcServer);
  url.searchParams.set('model', arg.model);
  const res = await fetch(url.pathname, {
    method: 'POST',
    body: JSON.stringify(arg.seq),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const body = await res.json();
  return body;
}
