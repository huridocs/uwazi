import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import {
  ReadableV1Connection,
  V1Connection,
  V1SelectionRectangle,
  V1TextReference,
} from '../model/V1Connection';
import {
  RectangleDBO,
  ReferenceDBO,
  V1ConnectionDBO,
  V1ConnectionDBOWithEntityInfo,
} from './schemas/v1ConnectionTypes';

const mapRectangleToDBO = (rectangle: V1SelectionRectangle): RectangleDBO => ({
  page: rectangle.page,
  top: rectangle.top,
  left: rectangle.left,
  height: rectangle.height,
  width: rectangle.width,
});

const mapRectangleToApp = (dbo: RectangleDBO): V1SelectionRectangle =>
  new V1SelectionRectangle(dbo.page, dbo.top, dbo.left, dbo.height, dbo.width);

const mapReferenceToDBO = (reference: V1TextReference): ReferenceDBO => ({
  text: reference.text,
  selectionRectangles: reference.selectionRectangles.map(mapRectangleToDBO),
});

const mapReferenceToApp = (dbo: V1ConnectionDBO): V1TextReference | undefined =>
  dbo.reference
    ? new V1TextReference(
        dbo.reference.text,
        dbo.reference.selectionRectangles.map(mapRectangleToApp)
      )
    : undefined;

const mapReadableConnectionToDBO = (
  connection: ReadableV1Connection
): V1ConnectionDBOWithEntityInfo => ({
  _id: MongoIdHandler.mapToDb(connection.id),
  entity: connection.entity,
  entityTemplateId: MongoIdHandler.mapToDb(connection.entityTemplate),
  entityTitle: connection.entityTitle,
  hub: MongoIdHandler.mapToDb(connection.hub),
  template: connection.template ? MongoIdHandler.mapToDb(connection.template) : undefined,
  templateName: connection.templateName,
  file: connection.file,
  reference: connection.reference ? mapReferenceToDBO(connection.reference) : undefined,
});

const mapConnectionToApp = (dbo: V1ConnectionDBO): V1Connection =>
  new V1Connection(
    dbo._id.toString(),
    dbo.entity,
    dbo.hub.toString(),
    dbo.template?.toString(),
    dbo.file,
    mapReferenceToApp(dbo)
  );

const mapConnectionsWithEntityInfoToApp = (
  dbo: V1ConnectionDBOWithEntityInfo
): ReadableV1Connection =>
  new ReadableV1Connection(
    dbo._id.toString(),
    dbo.entity,
    dbo.hub.toString(),
    dbo.template?.toString(),
    dbo.entityTemplateId.toString(),
    dbo.entityTitle,
    dbo.templateName,
    dbo.file,
    mapReferenceToApp(dbo)
  );

export { mapReadableConnectionToDBO, mapConnectionToApp, mapConnectionsWithEntityInfoToApp };
