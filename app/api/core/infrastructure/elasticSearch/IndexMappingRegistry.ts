import { EntityIndexMappingDefinition } from './entities/EntityIndexMappingDefinition.js';
import type { IndexDefinition } from './Types.js';

const IndexMappingRegistry: Record<string, IndexDefinition> = {
  entities: EntityIndexMappingDefinition,
};

export { IndexMappingRegistry };
