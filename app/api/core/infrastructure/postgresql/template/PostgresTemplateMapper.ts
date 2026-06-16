import { Template } from '#api/core/domain/template/Template.js';
import {
  CommonPropertyMapper,
  MongoTemplateMapper,
  MongoTemplatePropertyMapper,
} from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { PropertySchema } from '#shared/types/commonTypes.js';

export type TemplateRow = {
  _id: string;
  name: string;
  properties: PropertySchema[];
  commonProperties: PropertySchema[];
  color?: string;
  default: boolean;
  entityViewPage?: string;
  processing?: { active?: boolean; totalJobs?: number; completedJobs?: number };
};

export class PostgresTemplateMapper {
  static toDBO(template: Template): TemplateRow {
    const schema = MongoTemplateMapper.toSchema(template);
    return {
      _id: schema._id.toHexString(),
      name: schema.name,
      properties: schema.properties.map(p => ({ ...p, _id: p._id!.toString() })),
      commonProperties: schema.commonProperties.map(p => ({ ...p, _id: p._id!.toString() })),
      color: schema.color,
      default: schema.default ?? false,
      entityViewPage: schema.entityViewPage,
      processing: schema.processing,
    };
  }

  static toDomain(row: TemplateRow): Template {
    const templateId = row._id;

    const template = new Template(
      templateId,
      row.name,
      row.properties.map(item => MongoTemplatePropertyMapper.toDomain(item, templateId)),
      row.commonProperties.map(item => CommonPropertyMapper.toDomain(item, templateId)),
      row.color,
      row.default,
      row.entityViewPage
    );

    template.processing = row.processing;

    return template;
  }
}
