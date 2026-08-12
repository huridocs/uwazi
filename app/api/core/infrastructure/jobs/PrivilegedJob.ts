export const PRIVILEGED_JOB_MARKER = Symbol('privilegedJob');

export function PrivilegedJob() {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    Object.defineProperty(constructor, PRIVILEGED_JOB_MARKER, {
      value: true,
      writable: false,
      configurable: false,
    });
    return constructor;
  };
}

export function isPrivilegedJob(dispatchable: { name: string }): boolean {
  return PRIVILEGED_JOB_MARKER in dispatchable;
}
