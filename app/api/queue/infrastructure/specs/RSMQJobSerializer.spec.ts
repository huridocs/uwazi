/* eslint-disable max-classes-per-file */
import { Definitions } from 'api/queue/application/JobSerializer';
import { Job } from 'api/queue/contracts/Job';
import { RSMQJobSerializer } from '../RSMQJobSerializer';

describe('when there are definitions for a job', () => {
  it('should properly serialize and deserialize an object', async () => {
    const output: string[] = [];

    class TestJob extends Job {
      someData: { someAttribute: number };

      someOtherData: string = '';

      constructor(someData: { someAttribute: number }, someOtherData: string) {
        super();
        this.someData = someData;
        this.someOtherData = someOtherData;
      }

      private someOtherMethod() {
        output.push(`${this.someData.someAttribute} ${this.someOtherData}`);
      }

      async handle(): Promise<void> {
        this.someOtherMethod();
      }
    }

    const definitions: Definitions = {
      [TestJob.name]: { constructorFn: TestJob },
    };

    const instance = new TestJob({ someAttribute: 1 }, 'some text');

    const serialized = await RSMQJobSerializer.serialize(instance);
    const deserialized = await RSMQJobSerializer.deserialize('job id', serialized, definitions);

    expect(deserialized).toBeInstanceOf(TestJob);

    await deserialized.handle(async () => {});

    expect(output).toEqual(['1 some text']);
  });

  it('should assign the namespace at serialization time', async () => {
    class TestJob extends Job {
      // eslint-disable-next-line class-methods-use-this
      async handle(): Promise<void> {
        //
      }
    }

    const instance = new TestJob();

    let namespace = '1';
    const namespaceFactory = async () => namespace;
    namespace = '2';

    const serialized = await RSMQJobSerializer.serialize(instance, namespaceFactory);
    const deserialized = await RSMQJobSerializer.deserialize('job id', serialized, {
      [TestJob.name]: { constructorFn: TestJob },
    });

    expect(deserialized.namespace).toBe('2');
  });

  it('should assign the dependencies at deserialization time', async () => {
    const output: string[] = [];
    class Dependency {
      data: string;

      constructor(data: string) {
        this.data = data;
      }

      do() {
        output.push(this.data);
      }
    }

    class TestJob extends Job {
      dependency1?: Dependency;

      dependency2?: Dependency;

      // eslint-disable-next-line class-methods-use-this
      async handle(): Promise<void> {
        this.dependency1!.do();
        this.dependency2!.do();
      }
    }

    const instance = new TestJob();

    const dependenciesFactory = async () => ({
      dependency1: new Dependency('first'),
      dependency2: new Dependency('second'),
    });

    const serialized = await RSMQJobSerializer.serialize(instance);
    const deserialized = await RSMQJobSerializer.deserialize('job id', serialized, {
      [TestJob.name]: { constructorFn: TestJob, dependenciesFactory },
    });

    await deserialized.handle(async () => {});

    expect(output).toEqual(['first', 'second']);
  });
});

describe('when there are no definitions for a job', () => {
  it('should throw an exception', async () => {
    class TestJob extends Job {
      // eslint-disable-next-line class-methods-use-this
      async handle(): Promise<void> {
        //
      }
    }

    const instance = new TestJob();

    await expect(async () => {
      await RSMQJobSerializer.deserialize(
        'job id',
        await RSMQJobSerializer.serialize(instance),
        {}
      );
    }).rejects.toEqual(new Error('Unregistered job TestJob'));
  });
});
