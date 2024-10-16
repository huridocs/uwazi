import { ClientTemplateSchema } from 'app/istore';

const getTemplateName = (templates: ClientTemplateSchema[], targetId: string) => {
  const foundTemplate = templates.find(template => template._id === targetId);
  return foundTemplate?.name || targetId;
};

export { getTemplateName };
