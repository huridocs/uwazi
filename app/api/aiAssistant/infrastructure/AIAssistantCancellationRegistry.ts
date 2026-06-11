import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

const COLLECTION = 'ai_assistant_cancelled_jobs';

const getCollection = () => getConnection().collection(COLLECTION);

const AIAssistantCancellationRegistry = {
  async markCancelled(tenantName: string, jobId: string) {
    await getCollection().updateOne(
      { tenantName, jobId },
      { $set: { cancelledAt: Date.now() } },
      { upsert: true }
    );
  },

  async isCancelled(tenantName: string, jobId: string) {
    const doc = await getCollection().findOne({ tenantName, jobId });
    return Boolean(doc);
  },
};

export { AIAssistantCancellationRegistry };
