import { S3Client } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { config } from '#api/config.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';

export const buildS3Client = () => {
  const client = new S3Client({
    maxAttempts: 5,
    requestHandler: new NodeHttpHandler({
      socketTimeout: 30000,
      connectionTimeout: 3000,
      httpAgent: {
        maxSockets: 500,
        timeout: 60000,
        maxFreeSockets: 100,
        keepAlive: true,
        keepAliveMsecs: 5000,
      },
      httpsAgent: {
        maxSockets: 500,
        timeout: 60000,
        maxFreeSockets: 100,
        keepAlive: true,
        keepAliveMsecs: 5000,
      },
    }),
    apiVersion: 'latest',
    region: 'placeholder-region',
    endpoint: config.s3.endpoint,
    credentials: config.s3.credentials,
    forcePathStyle: true,
  });

  // eslint-disable-next-line max-statements
  client.middlewareStack.add((next, context) => async args => {
    const startTime = Date.now();

    const input = args.input as { Body?: Buffer; Key?: string };

    try {
      const result = await next(args);
      const duration = Date.now() - startTime;

      if (process.env.NODE_ENV !== 'test') {
        LoggerFactory.default().info('S3 operation completed', {
          operation: context.commandName,
          duration,
          key: input.Key,
          fileSizeKB: Buffer.isBuffer(input.Body) ? input.Body.length / 1024 : NaN,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }

      return result;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        LoggerFactory.default().info('S3 operation failed', {
          operation: context.commandName,
          duration: Date.now() - startTime,
          key: input.Key,
          fileSizeKB: Buffer.isBuffer(input.Body) ? input.Body.length / 1024 : NaN,
          success: false,
          error: error.message,
          errorCode: error.$metadata?.httpStatusCode,
          timestamp: new Date().toISOString(),
        });
      }
      throw error;
    }
  });
  return client;
};
