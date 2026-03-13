import { EntityIndexMappingDefinition } from './entities/EntityIndexMappingDefinition';
import type { IndexDefinition } from './Types';

const IndexMappingRegistry: Record<string, IndexDefinition> = {
  entities: EntityIndexMappingDefinition,
};

export { IndexMappingRegistry };
