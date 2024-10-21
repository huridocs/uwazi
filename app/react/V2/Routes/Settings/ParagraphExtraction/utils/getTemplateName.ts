import { Template } from 'app/apiResponseTypes';

const getTemplateName = (templates: Template[], targetId: string) => {
  const foundTemplate = templates.find(template => template._id === targetId);
  return foundTemplate?.name || targetId;
};

export { getTemplateName };
