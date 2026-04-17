export type Props = {
  resourceName: string;
  resourceId: string | number;
  expectedVersion: number;
};

export class OptimisticLockError extends Error {
  public readonly resourceName: string;

  public readonly resourceId: string | number;

  public readonly expectedVersion: number;

  constructor(params: Props) {
    const { resourceName, resourceId, expectedVersion } = params;

    const message = `Optimistic lock failed for ${resourceName}(${resourceId}). Expected version ${expectedVersion}.`;

    super(message);

    this.name = 'OptimisticLockError';
    this.resourceName = resourceName;
    this.resourceId = resourceId;
    this.expectedVersion = expectedVersion;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
