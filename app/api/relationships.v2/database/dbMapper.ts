import { ObjectId } from 'mongodb';

export function mapToObjectIds<DboType extends object, ModelType extends object>(
  model: DboType,
  idProperties: Array<keyof DboType>
): ModelType {
  return Object.assign(
    { ...model },
    ...idProperties.map(key => ({ [key]: new ObjectId(model[key] as unknown as string) }))
  );
}

export function mapFromObjectIds<ModelType extends object, DboType extends object>(
  model: Record<keyof ModelType, unknown>,
  idProperties: Array<keyof ModelType>
): DboType {
  return Object.assign(
    { ...model },
    ...idProperties.map(key => ({ [key]: (model[key] as ObjectId).toHexString() }))
  );
}

export function assignId<T>(model: T, _id: ObjectId): T {
  return Object.assign(model, { _id }) as T;
}
