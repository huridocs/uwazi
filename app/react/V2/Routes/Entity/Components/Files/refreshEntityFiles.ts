import { entityLoaderCache } from '../../EntityLoaderCache.js';

const refreshEntityFiles = async (
  sharedId: string,
  revalidate: () => Promise<void>,
  onRefreshEntity?: () => Promise<void>
) => {
  entityLoaderCache.invalidateEntity(sharedId);
  if (onRefreshEntity) {
    await onRefreshEntity();
    return;
  }
  await revalidate();
};

export { refreshEntityFiles };
