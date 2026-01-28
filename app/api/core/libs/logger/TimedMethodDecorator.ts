import { appContext } from 'api/utils/AppContext';

export function TimedMethod(operationName: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const telemetryCollector = appContext.getTelemetryCollector();

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
