import { ExecutionContext } from '../ExecutionContext.js';

export function TimedMethod(operationName: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if (!ExecutionContext.isTelemetryEnabled) {
        return originalMethod.apply(this, args);
      }

      return ExecutionContext.telemetryCollector.runSpan(operationName, () =>
        originalMethod.apply(this, args)
      );
    };

    return descriptor;
  };
}
