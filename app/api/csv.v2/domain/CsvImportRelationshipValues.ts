type CsvImportRelationshipValue = {
  label: string;
  sharedId: string;
};

type CsvImportRelationshipValuesProps = {
  importId: string;
  templateId: string;
  values: CsvImportRelationshipValue[];
  createdAt: number;
};

class CsvImportRelationshipValues {
  readonly importId!: string;
  readonly templateId!: string;
  readonly values!: CsvImportRelationshipValue[];
  readonly createdAt!: number;

  private constructor(props: CsvImportRelationshipValuesProps) {
    Object.assign(this, props);
  }

  static create(props: CsvImportRelationshipValuesProps) {
    return new CsvImportRelationshipValues(props);
  }

  toPersistence() {
    return {
      importId: this.importId,
      templateId: this.templateId,
      values: this.values,
      createdAt: this.createdAt,
    };
  }
}

export { CsvImportRelationshipValues };
export type { CsvImportRelationshipValue, CsvImportRelationshipValuesProps };
