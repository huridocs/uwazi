import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { EntitiesService } from 'api/core/application/EntitiesService';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportRelationshipPendingValuesDataSource } from '../contracts/CsvImportRelationshipPendingValuesDataSource';

const loadRelationshipCreationContext = async (params: {
  csvImportsDS: CsvImportsDataSource;
  relationshipPendingValuesDS: CsvImportRelationshipPendingValuesDataSource;
  importId: string;
}) => {
  const { csvImportsDS, relationshipPendingValuesDS, importId } = params;
  const csvImport = (await csvImportsDS.getById(importId)).getDataOrThrow();
  const pendingDocs = await relationshipPendingValuesDS.getByImport(importId);

  const titlesByTemplate = new Map<string, Set<string>>();
  pendingDocs.forEach(doc => {
    if (!doc.titles.length) {
      return;
    }
    const set = titlesByTemplate.get(doc.templateId) || new Set<string>();
    doc.titles.forEach(title => set.add(title));
    titlesByTemplate.set(doc.templateId, set);
  });

  return {
    csvImport,
    titlesByTemplate,
    totalTemplates: titlesByTemplate.size,
  };
};

const createRelationshipEntitiesBatch = async (params: {
  entitiesService: EntitiesService;
  transactionManager: TransactionManager;
  templateId: string;
  titles: string[];
  tenantName: string;
  userId: string;
}) => {
  const { entitiesService, transactionManager, templateId, titles, tenantName, userId } = params;
  if (!titles.length) {
    return 0;
  }
  const entities = await entitiesService.createMany({
    templateId,
    userId,
    count: titles.length,
  });
  entities.forEach((entity, index) => {
    const title = titles[index];
    entity.setPropertyAssignmentsInAllLanguages([
      entity.template.createPropertyAssignment('title', { value: [{ value: title }] }),
    ]);
  });
  await transactionManager.run(async () => {
    await entitiesService.bulkInsert(entities, { tenantName, actorId: userId });
  });
  return entities.length;
};

export { createRelationshipEntitiesBatch, loadRelationshipCreationContext };
