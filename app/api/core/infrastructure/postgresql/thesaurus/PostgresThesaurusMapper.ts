import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';

type ThesaurusValueRow = {
  id: string;
  label: string;
  values?: { id: string; label: string }[];
};

export type ThesaurusRow = {
  _id: string;
  name: string;
  values: ThesaurusValueRow[];
};

export class PostgresThesaurusMapper {
  static toDBO(thesaurus: Thesaurus): ThesaurusRow {
    return {
      _id: thesaurus.id,
      name: thesaurus.name,
      values: thesaurus.values.map(v => ({
        id: v.id,
        label: v.label,
        values: v.values?.map(sv => ({ id: sv.id, label: sv.label })),
      })),
    };
  }

  static toDomain(row: ThesaurusRow): Thesaurus {
    return new Thesaurus({
      id: row._id,
      name: row.name,
      values: row.values.map(v => ({
        id: v.id,
        label: v.label,
        values: v.values?.map(sv => ({ id: sv.id, label: sv.label })),
      })),
    });
  }
}
