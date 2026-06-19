import { deleteReference } from '#V2/api/relationships/index.js';
import { entityLoaderCache } from '../../../EntityLoaderCache.js';

type Revalidator = { revalidate: () => Promise<void> };

const deleteReferencesById = async (ids: string[]) => {
  await Promise.all(ids.map(async id => deleteReference(id)));
};

const refreshEntityRelationships = async (sharedId: string, revalidator: Revalidator) => {
  entityLoaderCache.invalidateEntity(sharedId);
  await revalidator.revalidate();
};

export { deleteReferencesById, refreshEntityRelationships };
