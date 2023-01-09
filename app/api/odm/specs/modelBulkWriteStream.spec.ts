import userModel from 'api/users/usersModel';
import db from 'api/utils/testing_db';
import { UserRole } from 'shared/types/userSchema';
import { ModelBulkWriteStream } from '../modelBulkWriteStream';

const fixtures = {
  users: [
    {
      _id: db.id(),
      username: 'admin',
      role: UserRole.ADMIN,
      email: 'admin@tenant.xy',
    },
    {
      _id: db.id(),
      username: 'editor',
      role: UserRole.EDITOR,
      email: 'editor@tenant.xy',
    },
    {
      _id: db.id(),
      username: 'collab',
      role: UserRole.COLLABORATOR,
      email: 'collab@tenant.xy',
    },
  ],
};

const newUsers = Array(11)
  .fill(0)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  .map((value: any, index: number) => ({
    username: `new_user_${index}`,
    role: UserRole.COLLABORATOR,
    email: `new_user_${index}@tenant.xy`,
    password: `new_user_pass_${index}`,
  }));

const checkNames = async (expectedUserNames: string[]) => {
  const inDbUserNames = (await db.mongodb?.collection('users').find({}).toArray())?.map(
    u => u.username
  );
  expect(inDbUserNames).toMatchObject(expectedUserNames);
};

const stackLimit = 5;

describe('modelBulkWriteStream', () => {
  let stream: ModelBulkWriteStream;

  beforeEach(async () => {
    await db.setupFixturesAndContext(fixtures);
    stream = new ModelBulkWriteStream(userModel, stackLimit);
  });

  afterAll(async () => {
    await db.disconnect();
  });
  it('should be able to insert', async () => {
    await stream.insert(newUsers[0]);
    await stream.flush();
    await checkNames(['admin', 'editor', 'collab', 'new_user_0']);
  });

  it('should be able to delete', async () => {
    await stream.delete({ _id: fixtures.users[1]._id });
    await stream.flush();
    await checkNames(['admin', 'collab']);
  });

  it('should be able to update', async () => {
    await stream.update(
      { _id: fixtures.users[2]._id },
      { $set: { username: 'collaborator_new_name' } }
    );
    await stream.flush();
    await checkNames(['admin', 'editor', 'collaborator_new_name']);
  });

  it('should be able to mix cases', async () => {
    await stream.insert(newUsers[0]);
    await stream.delete({ _id: fixtures.users[1]._id });
    await stream.update(
      { _id: fixtures.users[2]._id },
      { $set: { username: 'collaborator_new_name' } }
    );
    await stream.flush();
    await checkNames(['admin', 'collaborator_new_name', 'new_user_0']);
  });

  it('should empty actions when flushing', async () => {
    expect(stream.actions.length).toBe(0);
    await stream.insert(newUsers[0]);
    expect(stream.actions.length).toBe(1);
    await stream.delete({ _id: fixtures.users[1]._id });
    expect(stream.actions.length).toBe(2);
    await stream.insert(newUsers[2]);
    await stream.update(
      { _id: fixtures.users[2]._id },
      { $set: { username: 'collaborator_new_name' } }
    );
    await stream.flush();
    expect(stream.actions.length).toBe(0);
  });

  it('should automatically flush when reaching the set limit', async () => {
    expect(stream.actions.length).toBe(0);
    await Promise.all(newUsers.slice(0, 4).map(async u => stream.insert(u)));
    expect(stream.actions.length).toBe(4);
    await stream.insert(newUsers[4]);
    expect(stream.actions.length).toBe(0);
    await Promise.all(newUsers.slice(5).map(async u => stream.insert(u)));
    expect(stream.actions.length).toBe(1);
    await stream.flush();
    expect(stream.actions.length).toBe(0);
    expect((await db.mongodb?.collection('users').find({}).toArray())?.length).toBe(14);
  });
});
