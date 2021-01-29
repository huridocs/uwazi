import elasticSearch from '@elastic/elasticsearch';
import { writeAccessField, WriteAccessFieldParams } from '../scriptedFields';

const elasticClient = new elasticSearch.Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

const injectSource = <T>(fieldFactory: (params: T) => any, document: any) => (params: T) => {
  const { script } = fieldFactory(params);

  return {
    script: {
      ...script,
      params: {
        ...script.params,
        _source: document,
      },
    },
  };
};

describe('Elastic search scripted fields', () => {
  describe('write access', () => {
    const userID: string = 'someid';

    it('should return TRUE if the entity has explicit write permissions for the user', async () => {
      const fieldForDocument = injectSource<WriteAccessFieldParams>(writeAccessField, {
        permissions: [
          {
            _id: userID,
            type: 'user',
            level: 'write',
          },
        ],
      });

      const response = await elasticClient.scriptsPainlessExecute({
        body: {
          ...fieldForDocument({ ids: ['someid'] }),
        },
      });

      expect(response.body.result).toBe('true');
    });

    it('should return FALSE if the entity have only explicit read permissions for the user', async () => {
      const fieldForDocument = injectSource<WriteAccessFieldParams>(writeAccessField, {
        permissions: [
          {
            _id: userID,
            type: 'user',
            level: 'read',
          },
        ],
      });

      const response = await elasticClient.scriptsPainlessExecute({
        body: {
          ...fieldForDocument({ ids: ['someid'] }),
        },
      });

      expect(response.body.result).toBe('false');
    });

    it('should return FALSE if the entity does not have permissions for the user at all', async () => {
      const fieldForDocument = injectSource<WriteAccessFieldParams>(writeAccessField, {
        permissions: [
          {
            _id: 'someother user',
            type: 'user',
            level: 'write',
          },
        ],
      });

      const response = await elasticClient.scriptsPainlessExecute({
        body: {
          ...fieldForDocument({ ids: ['someid'] }),
        },
      });

      expect(response.body.result).toBe('false');
    });

    it('should return FALSE if the entity does not have a permissions attribute', async () => {
      const fieldForDocument = injectSource<WriteAccessFieldParams>(writeAccessField, {});

      const response = await elasticClient.scriptsPainlessExecute({
        body: {
          ...fieldForDocument({ ids: ['someid'] }),
        },
      });

      expect(response.body.result).toBe('false');
    });

    it('should return TRUE if the entity has explicit write permissions for the group', async () => {
      const groupID = 'somegroup';

      const fieldForDocument = injectSource<WriteAccessFieldParams>(writeAccessField, {
        permissions: [
          {
            _id: userID,
            type: 'user',
            level: 'read',
          },
          {
            _id: groupID,
            type: 'group',
            level: 'write',
          },
        ],
      });

      const response = await elasticClient.scriptsPainlessExecute({
        body: {
          ...fieldForDocument({ ids: [userID, groupID] }),
        },
      });

      expect(response.body.result).toBe('true');
    });

    it('should return FALSE if the entity has no explicit write permissions for the group', async () => {
      const groupID = 'somegroup';

      const fieldForDocument = injectSource<WriteAccessFieldParams>(writeAccessField, {
        permissions: [
          {
            _id: userID,
            type: 'user',
            level: 'read',
          },
          {
            _id: groupID,
            type: 'group',
            level: 'read',
          },
        ],
      });

      const response = await elasticClient.scriptsPainlessExecute({
        body: {
          ...fieldForDocument({ ids: [userID, groupID] }),
        },
      });

      expect(response.body.result).toBe('false');
    });
  });
});
