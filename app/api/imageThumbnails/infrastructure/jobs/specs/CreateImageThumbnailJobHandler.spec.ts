import { queueOptionsOf } from '#api/core/libs/queue/application/QueueOptions.js';
import { CreateImageThumbnailJobHandler } from '../CreateImageThumbnailJobHandler.js';

describe('CreateImageThumbnailJobHandler', () => {
  it('keeps the queue default retry count', () => {
    expect(queueOptionsOf(CreateImageThumbnailJobHandler)).toEqual({ lockWindow: 60_000 });
  });
});
