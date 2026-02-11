import { DependenciesContext } from '../DependenciesContext';

export function TimedMethod(operationName: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const { telemetryCollector } = DependenciesContext;

      if (!telemetryCollector) {
        return originalMethod.apply(this, args);
      }

      telemetryCollector.timeStart(operationName);

      const result = await originalMethod.apply(this, args);

      telemetryCollector.timeEnd(operationName);

      return result;
    };

    return descriptor;
  };
}
