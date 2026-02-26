type CsvImportRelationshipPendingValuesProps = {
  importId: string;
  templateId: string;
  titles: string[];
  createdAt: number;
};

class CsvImportRelationshipPendingValues {
  readonly importId!: string;
  readonly templateId!: string;
  readonly titles!: string[];
  readonly createdAt!: number;

  private constructor(props: CsvImportRelationshipPendingValuesProps) {
    Object.assign(this, props);
  }

  static create(props: CsvImportRelationshipPendingValuesProps) {
    return new CsvImportRelationshipPendingValues(props);
  }

  toPersistence() {
    return {
      importId: this.importId,
      templateId: this.templateId,
      titles: this.titles,
      createdAt: this.createdAt,
    };
  }
}

export { CsvImportRelationshipPendingValues };
export type { CsvImportRelationshipPendingValuesProps };
