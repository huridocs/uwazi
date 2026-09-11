import express from 'express';
import type { Server } from 'http';
import type { AddressInfo } from 'net';
import superagent from 'superagent';
import type { HttpClient } from '#api/common.v2/contracts/HttpClient.js';
import { ExternalTranslationService } from '../ExternalTranslationService.js';

describe('ExternalTranslationService', () => {
  const app = express();
  let server: Server;
  let baseUrl: string;
  let lastTimeoutMs: number | undefined;

  const httpClient: HttpClient = {
    async get<Response>(input: { url: string }) {
      const response = await superagent.get(input.url);
      return response.body as Response;
    },
    async postJson<Response>(input: { url: string; body: string | object; timeoutMs?: number }) {
      lastTimeoutMs = input.timeoutMs;
      const request = superagent.post(input.url).send(input.body);
      if (input.timeoutMs !== undefined) {
        request.timeout(input.timeoutMs);
      }
      const response = await request;
      return response.body as Response;
    },
    async delete(input: { url: string; body?: string | object }) {
      const request = superagent.delete(input.url);
      if (input.body !== undefined) {
        request.send(input.body);
      }
      await request;
    },
    postFormData: jest.fn(),
  };

  beforeAll(async () => {
    app.post('/translate', (req, res) => {
      const { text, language_from, language_to } = req.query;
      if (text === 'error') {
        res.status(500).json({ detail: 'translation failed' });
        return;
      }
      res.status(200).json({
        translated_text: `[${language_from}->${language_to}] ${text}`,
      });
    });

    await new Promise<void>(resolve => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close(error => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  beforeEach(() => {
    lastTimeoutMs = undefined;
  });

  it('should call /translate with query params and return translated_text', async () => {
    const service = new ExternalTranslationService({ url: baseUrl, httpClient });

    const result = await service.translate({
      text: 'hola que tal',
      language_from: 'es',
      language_to: 'ar',
    });

    expect(result).toEqual({ translated_text: '[es->ar] hola que tal' });
    expect(lastTimeoutMs).toBe(60_000);
  });

  it('should throw when translated_text is missing', async () => {
    app.post('/translate-empty', (_req, res) => {
      res.status(200).json({});
    });

    const service = new ExternalTranslationService({
      url: baseUrl,
      httpClient,
      translatePath: '/translate-empty',
    });

    await expect(
      service.translate({
        text: 'hola',
        language_from: 'es',
        language_to: 'ar',
      })
    ).rejects.toThrow('Translation service did not return translated_text');
  });
});
