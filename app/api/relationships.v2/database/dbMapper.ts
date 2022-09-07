import { ObjectId } from 'mongodb';

type PropsMappedToType<Source, Keys extends keyof Source, T> = {
  [K in keyof Source]: K extends Keys ? T : Source[K];
};

type KeysOfType<T extends object, Type> = {
  [K in keyof T]: T[K] extends Type ? K : never;
}[keyof T];

function mapValues<SourceType extends object, Type, Keys extends KeysOfType<SourceType, Type>, T>(
  model: SourceType,
  idProperties: Array<Keys>,
  mapEntry: (entry: SourceType[Keys]) => T
): PropsMappedToType<SourceType, Keys, T> {
  return Object.assign({ ...model }, ...idProperties.map(key => ({ [key]: mapEntry(model[key]) })));
}

export function mapToObjectIds<
  SourceType extends object,
  Keys extends KeysOfType<SourceType, string>
>(model: SourceType, idProperties: Array<Keys>): PropsMappedToType<SourceType, Keys, ObjectId> {
  return mapValues(model, idProperties, entry => new ObjectId(entry as unknown as string));
}

export function mapFromObjectIds<
  SourceType extends object,
  Keys extends KeysOfType<SourceType, ObjectId>
>(model: SourceType, idProperties: Array<Keys>): PropsMappedToType<SourceType, Keys, string> {
  return mapValues(model, idProperties, entry => (entry as unknown as ObjectId).toHexString());
}

export function assignId<T>(model: T, _id: ObjectId): T {
  return Object.assign(model, { _id }) as T;
}
