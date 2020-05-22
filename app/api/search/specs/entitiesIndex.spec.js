import elastic from '../elastic';
import { handledFailedDocsByLargeFieldErrors } from '../entitiesIndex';

jest.mock('../elastic');

describe('indexEntities', () => {
  const longField = `${Math.random()
    .toString(36)
    .repeat(20000)}_last`;

  const longFieldTruncated = longField.substr(0, 100);
  const reasonPrefix = 'Document contains at least one immense term in field=';

  elastic.bulk.mockResolvedValue(() => Promise.resolve(''));

  describe('handledFailedDocsByLargeFieldErrors', () => {
    it('should index the docs with the long fields trunctated', () => {
      const inputBody = [{ index: { _id: 'id1' } }, { title: longField }];
      const body = [{ index: { _id: 'id1' } }, { title: longFieldTruncated }];
      const reason = `${reasonPrefix}"title.raw" (whose `;
      const errors = [{ index: { _id: 'id1', error: { reason } } }];
      handledFailedDocsByLargeFieldErrors(inputBody, errors);
      expect(elastic.bulk).toHaveBeenCalledWith({ body, requestTimeout: 40000 });
    });

    it('should throw an exception with the names of the invalid fields', async () => {
      const inputBody = [
        { index: { _id: 'id1' } },
        { title2: longField },
        { index: { _id: 'id2' } },
        { title3: longField },
      ];
      const reason1 = `${reasonPrefix}"title2.raw" (whose `;
      const reason2 = `${reasonPrefix}"title3.raw" (whose `;
      const errors = [
        { index: { _id: 'id1', error: { reason: reason1 } } },
        { index: { _id: 'id2', error: { reason: reason2 } } },
      ];
      try {
        await handledFailedDocsByLargeFieldErrors(inputBody, errors);
        fail('should throw an exception');
      } catch (e) {
        expect(e.message).toContain('title2');
        expect(e.message).toContain('title3');
      }
    });

    it('should have to support nested long fields', () => {
      const inputBody = [
        { index: { _id: 'id1' } },
        { title: 'long doc', metadata: { summary: [{ value: longField }] } },
      ];
      const body = [
        { index: { _id: 'id1' } },
        { title: 'long doc', metadata: { summary: [{ value: longFieldTruncated }] } },
      ];
      const reason = `${reasonPrefix}"metadata.summary.value.raw" (whose `;
      const errors = [{ index: { _id: 'id1', error: { reason } } }];
      try {
        handledFailedDocsByLargeFieldErrors(inputBody, errors);
      } catch (e) {
        expect(e.message).toContain('metadata.summary.value');
        expect(elastic.bulk).toHaveBeenCalledWith({ body, requestTimeout: 40000 });
      }
    });
  });
});
