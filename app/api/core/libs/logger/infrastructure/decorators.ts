import { appContext } from 'api/utils/AppContext';
import { LogBuilder } from './LogBuilder';

export function TimedMethod(identifier: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logBuilder = appContext.get('logBuilder') as LogBuilder;

      if (!logBuilder) {
        return originalMethod.apply(this, args);
      }

      logBuilder.timeStart(identifier);

      try {
        await originalMethod.apply(this, args);
      } finally {
        logBuilder.timeEnd(identifier);
      }
    };

    return descriptor;
  };
}
