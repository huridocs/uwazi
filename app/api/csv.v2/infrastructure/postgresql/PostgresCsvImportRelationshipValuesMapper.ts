import {
  CsvImportRelationshipValue,
  CsvImportRelationshipValues,
} from '../../domain/CsvImportRelationshipValues.js';

export type CsvImportRelationshipValuesRow = {
  _id: string;
  import_id: string;
  template_id: string;
  values: CsvImportRelationshipValue[];
  created_at: number;
};

export class PostgresCsvImportRelationshipValuesMapper {
  static toDomain(row: CsvImportRelationshipValuesRow): CsvImportRelationshipValues {
    return CsvImportRelationshipValues.create({
      id: row._id,
      importId: row.import_id,
      templateId: row.template_id,
      values: row.values,
      createdAt: Number(row.created_at),
    });
  }

  static toRow(doc: CsvImportRelationshipValues): CsvImportRelationshipValuesRow {
    const obj = doc.toPersistence();
    return {
      _id: obj.id,
      import_id: obj.importId,
      template_id: obj.templateId,
      values: obj.values,
      created_at: obj.createdAt,
    };
  }
}
