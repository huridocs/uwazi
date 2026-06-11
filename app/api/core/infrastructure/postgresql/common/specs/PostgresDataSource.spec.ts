import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresDataSource } from '../PostgresDataSource.js';

type TestRow = {
  _id: string;
  name: string;
  tenant_id: string;
};

class TestDataSource extends PostgresDataSource {
  protected tableName = 'thesauri';

  async insertRow(id: string, name: string) {
    await this.table.insert({ _id: id, name, values: JSON.stringify([]) });
  }

  async getById(id: string) {
    return this.table.query<TestRow>().where({ _id: id }).first();
  }

  async getAll() {
    return this.table.query<TestRow>().all();
  }

  async rowCount() {
    return this.table.query<TestRow>().count();
  }

  async updateRow(id: string, name: string) {
    await this.table.query().where({ _id: id }).update({ name });
  }

  async deleteRow(id: string) {
    await this.table.query().where({ _id: id }).delete();
  }
}

const makeDS = (tenantId: string) =>
  new TestDataSource({
    connection: testingPG.config,
    tenantId,
  });

beforeAll(async () => {
  await testingEnvironment.setUp({}, { postgres: true });
});

beforeEach(async () => {
  await testingPG.clear(['thesauri']);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('PostgresDataSource', () => {
  describe('multitenancy', () => {
    it('should isolate tenant A from tenant B', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');

      await dsA.insertRow('item-1', 'A item');

      const rowsB = await dsB.getAll();
      expect(rowsB).toHaveLength(0);
    });

    it('should allow both tenants to have rows with the same _id', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');

      await dsA.insertRow('same-id', 'data-A');
      await dsB.insertRow('same-id', 'data-B');

      expect(await dsA.rowCount()).toBe(1);
      expect(await dsB.rowCount()).toBe(1);

      const rowA = await dsA.getById('same-id');
      const rowB = await dsB.getById('same-id');

      expect(rowA!.name).toBe('data-A');
      expect(rowB!.name).toBe('data-B');
    });

    it('should not allow tenant A to update tenant B rows', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');

      await dsA.insertRow('item-1', 'original-A');

      await dsB.updateRow('item-1', 'should-not-work');

      const row = await dsA.getById('item-1');
      expect(row!.name).toBe('original-A');
    });

    it('should not allow tenant A to delete tenant B rows', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');

      await dsA.insertRow('item-1', 'protect-me');

      await dsB.deleteRow('item-1');

      expect(await dsA.rowCount()).toBe(1);
    });

    it('should support multiple datasources from different tenants', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');
      const dsC = makeDS('tenant-c');

      await dsA.insertRow('a1', 'A data');
      await dsB.insertRow('b1', 'B data');
      await dsC.insertRow('c1', 'C data');

      expect(await dsA.rowCount()).toBe(1);
      expect(await dsB.rowCount()).toBe(1);
      expect(await dsC.rowCount()).toBe(1);
    });

    it('should isolate findAll results per tenant', async () => {
      const dsA = makeDS('tenant-a');
      const dsB = makeDS('tenant-b');

      await dsA.insertRow('a1', 'A1');
      await dsA.insertRow('a2', 'A2');
      await dsB.insertRow('b1', 'B1');

      const aRows = await dsA.getAll();
      expect(aRows).toHaveLength(2);
      expect(aRows.every((r: TestRow) => r.tenant_id === 'tenant-a')).toBe(true);

      const bRows = await dsB.getAll();
      expect(bRows).toHaveLength(1);
      expect(bRows[0].tenant_id).toBe('tenant-b');
    });
  });
});
