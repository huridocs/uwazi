import { ObjectId } from 'mongodb';

type RectangleDBO = {
  page: string;
  top: number;
  left: number;
  height: number;
  width: number;
};

type ReferenceDBO = {
  text: string;
  selectionRectangles: RectangleDBO[];
};

type V1ConnectionDBO = {
  _id: ObjectId;
  entity: string;
  hub: ObjectId;
  template?: ObjectId;
  file?: string;
  reference?: ReferenceDBO;
};

type V1ConnectionDBOWithEntityInfo = V1ConnectionDBO & {
  entityTemplateId: ObjectId;
  entityTitle: string;
  templateName: string;
};

type MigrationHubRecordDBO = {
  hubId: ObjectId;
  connections: V1ConnectionDBOWithEntityInfo[];
};

export type {
  RectangleDBO,
  ReferenceDBO,
  V1ConnectionDBO,
  V1ConnectionDBOWithEntityInfo,
  MigrationHubRecordDBO,
};
