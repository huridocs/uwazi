/** @format */

import 'isomorphic-fetch';
import { tcServer } from 'api/config/topicclassification';
import { URL } from 'url';

export async function getModels() {
  const tcUrl = new URL('models', tcServer);
  const res = await fetch(tcUrl.href, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const body = await res.json();
  return body;
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
