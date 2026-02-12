import { DependenciesContext } from '../DependenciesContext';

export function TimedMethod(operationName: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const { telemetryCollector } = DependenciesContext;

      if (!telemetryCollector) {
        return originalMethod.apply(this, args);
      }

      const endTimer = telemetryCollector.startTimer(operationName);

      const result = await originalMethod.apply(this, args);

      endTimer();

      return result;
    };

    return descriptor;
  };
}
