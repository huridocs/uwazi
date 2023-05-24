import { Definition, JobSerializer } from '../application/JobSerializer';
import { Job } from '../contracts/Job';

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
          ...Object.getOwnPropertyDescriptor(definition.constructorFn.prototype, property),
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
              ...Object.getOwnPropertyDescriptor(definition.constructorFn.prototype, property),
              value: builtDependencies[property] as any,
            },
          }),
          {}
        )
      : {};

    const managedFieldsDescriptors = {
      id: {
        ...Object.getOwnPropertyDescriptor(definition.constructorFn.prototype, 'id'),
        value: id,
      },
      namespace: {
        ...Object.getOwnPropertyDescriptor(definition.constructorFn.prototype, 'namespace'),
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
