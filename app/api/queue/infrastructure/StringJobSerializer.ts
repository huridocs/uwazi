import { Definition, JobSerializer } from '../application/JobSerializer';
import { Job } from '../contracts/Job';

const DEFAULT_DESCRIPTOR = {
  enumerable: true,
};

export const StringJobSerializer: JobSerializer = {
  async serialize(job: Job, namespace: string) {
    return JSON.stringify({
      name: job.constructor.name,
      namespace,
      data: job,
    });
  },

  async deserialize(id: string, serialized: string, definitions: Record<string, Definition<any>>) {
    const data = JSON.parse(serialized);

    const definition = definitions[data.name];

    if (!definition) {
      throw new Error(`Unregistered job ${data.name}`);
    }

    const propertyDescriptors = Object.keys(data.data).reduce(
      (properties, property) => ({
        ...properties,
        [property]: {
          ...DEFAULT_DESCRIPTOR,
          value: data.data[property],
        },
      }),
      {}
    );

    const builtDependencies = await definition.dependenciesFactory?.(data.namespace);

    const dependenciesDescriptors = builtDependencies
      ? Object.keys(builtDependencies).reduce(
          (properties, property) => ({
            ...properties,
            [property]: {
              ...DEFAULT_DESCRIPTOR,
              value: builtDependencies[property] as any,
            },
          }),
          {}
        )
      : {};

    const managedFieldsDescriptors = {
      id: {
        ...DEFAULT_DESCRIPTOR,
        value: id,
      },
      namespace: {
        ...DEFAULT_DESCRIPTOR,
        value: data.namespace,
      },
    };

    return Object.create(definition.constructorFn.prototype, {
      ...propertyDescriptors,
      ...dependenciesDescriptors,
      ...managedFieldsDescriptors,
    }) as Job;
  },
};
