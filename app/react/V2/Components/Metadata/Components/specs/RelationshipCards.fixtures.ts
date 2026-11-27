import type { ClientProperty, ClientTemplateSchema } from '#V2/shared/types.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { RelationshipMetadataProperty } from '#V2/formatters/types.js';

const personTemplate: ClientTemplateSchema = {
  _id: 'person-tmpl',
  name: 'Person',
  properties: [
    { _id: 'country-id', name: 'country', type: 'text', label: 'Country' },
    { _id: 'role-id', name: 'role', type: 'text', label: 'Role' },
  ],
};

const peopleCountryProp: ClientProperty = {
  _id: 'p-country',
  name: 'people_country',
  type: 'relationship',
  label: 'People involved',
  content: 'person-tmpl',
  relationType: 'rel-people',
  inherit: { property: 'country-id', type: 'text' },
};

const peopleRoleProp: ClientProperty = {
  _id: 'p-role',
  name: 'people_role',
  type: 'relationship',
  label: 'Role field',
  content: 'person-tmpl',
  relationType: 'rel-people',
  inherit: { property: 'role-id', type: 'text' },
};

const peopleDirectProp: ClientProperty = {
  _id: 'p-direct',
  name: 'people_direct',
  type: 'relationship',
  label: 'Direct people',
  content: 'person-tmpl',
  relationType: 'rel-people',
};

const otherInheritProp: ClientProperty = {
  _id: 'p-other',
  name: 'other_rel',
  type: 'relationship',
  label: 'Other inherit',
  content: 'org-tmpl',
  relationType: 'rel-other',
  inherit: { property: 'country-id', type: 'text' },
};

const entity: Entity = {
  _id: 'e1',
  sharedId: 's1',
  title: 'Case',
  template: 'case-tmpl',
  language: 'en',
  creationDate: 1,
  user: 'u1',
  metadata: {
    people_country: [
      {
        value: 'entity-1',
        label: 'Ada',
        inheritedType: 'text',
        inheritedValue: [{ value: 'Kenya', label: 'Kenya' }],
      },
    ],
    people_role: [
      {
        value: 'entity-1',
        label: 'Ada',
        inheritedType: 'text',
        inheritedValue: [{ value: 'Witness', label: 'Witness' }],
      },
    ],
    other_rel: [
      {
        value: 'entity-1',
        label: 'Ada',
        inheritedType: 'text',
        inheritedValue: [{ value: 'Uganda', label: 'Uganda' }],
      },
    ],
  },
};

const field = ({
  id,
  name,
  label,
  title = 'Ada',
  values,
}: {
  id: string;
  name: string;
  label: string;
  title?: string;
  values?: { _id: string; title: string; templateId: string }[];
}): RelationshipMetadataProperty => ({
  _id: id,
  name,
  label,
  type: 'relationship',
  mode: 'related',
  inherited: true,
  values: values ?? [{ _id: 'entity-1', title, templateId: 'person-tmpl' }],
});

export {
  entity,
  field,
  otherInheritProp,
  peopleCountryProp,
  peopleDirectProp,
  peopleRoleProp,
  personTemplate,
};
