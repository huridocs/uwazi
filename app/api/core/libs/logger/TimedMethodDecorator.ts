import { ExecutionContext } from '../ExecutionContext.js';

export function TimedMethod(operationName: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const telemetryCollector = ExecutionContext.getStore()
        ? ExecutionContext.telemetryCollector
        : undefined;

      if (!telemetryCollector) {
        return originalMethod.apply(this, args);
      }

      return telemetryCollector.runSpan(operationName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
