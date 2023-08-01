import { MigrationPlan, MigrationResponse } from './relationships.migrate';
import { EntityReference, TextReference } from './relationships.createRelationshipsRequest';

type TestOneHubRequest = {
  hubId: string;
  migrationPlan: MigrationPlan;
};

type V1SelectionRectangle = {
  top: number;
  left: number;
  height: number;
  width: number;
  page: string;
};

type V1TextReference = {
  text: string;
  selectionRectangles: V1SelectionRectangle[];
};

type ReadableV1Connection = {
  id: string;
  entity: string;
  hub: string;
  template?: string;
  entityTemplate: string;
  entityTitle: string;
  templateName: string;
  file?: string;
  reference?: V1TextReference;
};

type EntityReferenceResponse = Omit<EntityReference, 'type'>;

type TextReferenceResponse = Omit<TextReference, 'type'>;

type PointerResponse = EntityReferenceResponse | TextReferenceResponse;

type RelationshipDataResponse = {
  from: PointerResponse;
  to: PointerResponse;
  type: string;
};

type TestOneHubResponse = Omit<MigrationResponse, 'time' | 'dryRun'> & {
  transformed: RelationshipDataResponse[];
  original: ReadableV1Connection[];
};

export type { TestOneHubRequest, TestOneHubResponse, ReadableV1Connection };
