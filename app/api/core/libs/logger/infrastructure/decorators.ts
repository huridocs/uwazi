import { appContext } from 'api/utils/AppContext';
import { LogBuilder } from './LogBuilder';

/**
 * Method decorator that automatically times async method execution
 * @param operationName Optional name for the timing metric. If not provided, uses className_methodName
 *
 * @example
 * class MyController {
 *   @TimeAsync('my_operation')
 *   async handle() {
 *     // Method is automatically timed
 *   }
 * }
 */
export function TimeAsync(operationName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logBuilder = appContext.get('logBuilder') as LogBuilder;

      if (!logBuilder) {
        // If no logBuilder, just execute normally
        return originalMethod.apply(this, args);
      }

      const timingName = operationName || `${target.constructor.name}_${propertyKey}`;

      return logBuilder.timeAsync(timingName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Class decorator that automatically times the handle() method of controllers
 * Derives the timing name from the class name (snake_case)
 *
 * @example
 * @TimedController
 * class MyController extends AbstractController {
 *   async handle() {
 *     // Automatically timed as 'my_controller'
 *   }
 * }
 */
export function TimedController(constructor: Function) {
  const originalHandle = constructor.prototype.handle;

  if (originalHandle) {
    const className = constructor.name
      .replace(/Controller$/, '') // Remove 'Controller' suffix
      .replace(/([A-Z])/g, '_$1') // Add underscore before capitals
      .toLowerCase()
      .replace(/^_/, ''); // Remove leading underscore

    constructor.prototype.handle = async function (...args: any[]) {
      const logBuilder = appContext.get('logBuilder') as LogBuilder;

      if (!logBuilder) {
        return originalHandle.apply(this, args);
      }

      return logBuilder.timeAsync(className, () => originalHandle.apply(this, args));
    };
  }

  return constructor;
}

/**
 * Method decorator for controllers that accepts a custom identifier to log
 * The identifier will be added to the log context before executing the method
 *
 * @param identifier String identifier to add to logs (e.g., controller name, operation type)
 *
 * @example
 * class MyController extends AbstractController {
 *   @TimedMethod('fetch_user_data')
 *   async handle() {
 *     // Automatically timed with identifier 'fetch_user_data'
 *   }
 * }
 */
export function TimedMethod(identifier: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logBuilder = appContext.get('logBuilder') as LogBuilder;

      if (!logBuilder) {
        return originalMethod.apply(this, args);
      }

      logBuilder.add({ operation: identifier });

      return logBuilder.timeAsync(identifier, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
