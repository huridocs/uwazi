/**
 * @jest-environment jsdom
 */
import { entityLoaderCache } from '../../../EntityLoaderCache.js';
import { refreshEntityFiles } from '../refreshEntityFiles.js';

describe('refreshEntityFiles', () => {
  it('refreshes the preview entity without revalidating the library route', async () => {
    const invalidateEntity = jest.spyOn(entityLoaderCache, 'invalidateEntity');
    const onRefreshEntity = jest.fn().mockResolvedValue(undefined);
    const revalidate = jest.fn().mockResolvedValue(undefined);

    await refreshEntityFiles('shared-1', revalidate, onRefreshEntity);

    expect(invalidateEntity).toHaveBeenCalledWith('shared-1');
    expect(onRefreshEntity).toHaveBeenCalledTimes(1);
    expect(revalidate).not.toHaveBeenCalled();

    invalidateEntity.mockRestore();
  });

  it('revalidates the entity route when no preview refresh is provided', async () => {
    const invalidateEntity = jest.spyOn(entityLoaderCache, 'invalidateEntity');
    const revalidate = jest.fn().mockResolvedValue(undefined);

    await refreshEntityFiles('shared-1', revalidate);

    expect(invalidateEntity).toHaveBeenCalledWith('shared-1');
    expect(revalidate).toHaveBeenCalledTimes(1);

    invalidateEntity.mockRestore();
  });
});
