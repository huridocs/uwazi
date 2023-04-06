import { MongoIdHandler } from 'api/common.v2/database/MongoIdGenerator';
import { Template } from '../model/Template';
import { TemplateDBO } from './schemas/TemplateDBO';

export const TemplateMappers = {
  DBOToApp: (tdbo: TemplateDBO): Template =>
    new Template(MongoIdHandler.mapToApp(tdbo._id), tdbo.name),
};
