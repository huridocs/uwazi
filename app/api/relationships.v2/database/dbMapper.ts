import { ObjectId } from 'mongodb';

export function mapToObjectIds<T extends object>(model: T, idProperties: Array<keyof T>): unknown {
  return Object.assign(
    { ...model },
    ...idProperties.map(key => ({ [key]: new ObjectId(model[key] as unknown as string) }))
  );
}

export function mapFromObjectIds<T>(
  model: Record<keyof T, unknown>,
  idProperties: Array<keyof T>
): T {
  return Object.assign(
    { ...model },
    ...idProperties.map(key => ({ [key]: (model[key] as ObjectId).toHexString() }))
  );
}

export function assignId<T>(model: T, _id: ObjectId): T {
  return Object.assign(model, { _id }) as T;
}
