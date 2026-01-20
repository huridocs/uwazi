import { Thesaurus } from '#api/core/domain/thesaurus/Thesaurus.js';
import { ObjectId } from 'mongodb';
import { ThesaurusDBO } from '#api/core/infrastructure/mongodb/thesauri/ThesaurusDBO.js';

export class MongoThesaurusMapper {
  static toDBO(domain: Thesaurus): ThesaurusDBO {
    return {
      _id: ObjectId.createFromHexString(domain.id),
      name: domain.name,
      values: domain.values.map(value => ({
        id: value.id,
        label: value.label,
        values: value.values?.map(subValue => ({
          id: subValue.id,
          label: subValue.label,
        })),
      })),
    };
  }

  static toDomain(schema: ThesaurusDBO): Thesaurus {
    return new Thesaurus({
      id: schema._id.toHexString(),
      name: schema.name,
      values: schema.values?.map(value => ({
        id: value.id,
        label: value.label,
        values: value.values?.map(subValue => ({
          id: subValue.id,
          label: subValue.label,
        })),
      })),
    });
  }
}
