import { TemplateSchema } from 'shared/types/templateType';

const formatters: {
  [key: string]: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => string;
} = {
  select: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  multiselect: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  date: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  daterange: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  geolocation: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  image: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  link: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  markdown: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  media: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  multidate: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  multidaterange: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  nested: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  numeric: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  preview: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  relationship: (field: any, rowTemplate: TemplateSchema, thesaurus: any) => '',
  text: (field: any) => (field[0] ? field[0].value : ''),
};

export default formatters;
