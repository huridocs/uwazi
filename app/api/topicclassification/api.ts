/** @format */

import 'isomorphic-fetch';
import { tcServer } from 'api/config/topicclassification';

export async function getModels() {
  console.dir(getModels);
  const url = new URL('models', tcServer);
  console.dir(url);
  const res = await fetch(url.pathname, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const body = await res.json();
  return body;
}

export async function checkModelReady(arg: { model: string }) {
  console.dir('checkModelReady api.ts');
  const url = new URL('models', tcServer);
  url.searchParams.set('model', arg.model);
  const res = await fetch(url.pathname, {
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
