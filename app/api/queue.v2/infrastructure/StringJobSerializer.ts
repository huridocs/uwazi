import { Definition, JobSerializer } from '../application/JobSerializer';
import { Job } from '../contracts/Job';

const DEFAULT_DESCRIPTOR = {
  enumerable: true,
};

const buildPropertyDescriptors = (data: any) => {
  const propertyDescriptors: Record<string, any> = {};

  Object.entries(data).forEach(([name, value]) => {
    propertyDescriptors[name] = {
      ...DEFAULT_DESCRIPTOR,
      value,
    };
  });

  return propertyDescriptors;
};

const buildDependencyDescriptors = async (definition: Definition<any>, namespace: string) => {
  const builtDependencies = await definition.dependenciesFactory?.(namespace);

  const dependenciesDescriptors: Record<string, any> = {};

  if (builtDependencies) {
    Object.entries(builtDependencies).forEach(([name, value]) => {
      dependenciesDescriptors[name] = {
        ...DEFAULT_DESCRIPTOR,
        value,
      };
    });
  }

  return dependenciesDescriptors;
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
      ...buildPropertyDescriptors(data.data),
      ...(await buildDependencyDescriptors(definition, data.namespace)),
      ...managedFieldsDescriptors,
    }) as Job;
  },
};
