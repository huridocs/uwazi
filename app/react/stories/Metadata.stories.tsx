import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Title, Date, Geolocation } from 'V2/Components/Metadata';
import { createStore, Provider } from 'jotai';
import { settingsAtom } from 'app/V2/atoms';

const store = createStore();
store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'] });

type StoryProps = {
  entity: any;
};

const MetadataDisplay = ({ entity }: StoryProps) => (
  <dl className="flex flex-col gap-4">
    {/* <Translate translationContext={entity.template.name}>{entity.template.label}</Translate> */}
    <Title
      title={entity.title}
      label="placeholder"
      translationContext={entity.template.name}
      iconId={entity.icon._id}
    />
    <Date timestamps={[entity.creationDate]} label="Creation date" translationContext="System" />
    <Date timestamps={[entity.editDate]} label="Edit date" translationContext="System" />
    {entity.metadata.map(data => {
      if (
        data.type === 'date' ||
        data.type === 'daterange' ||
        data.type === 'multidate' ||
        data.type === 'multidaterange'
      ) {
        return (
          <Date
            timestamps={data.values}
            label={data.label}
            translationContext={entity.template.name}
          />
        );
      }

      if (data.type === 'geolocation') {
        return (
          <Geolocation
            markers={[
              {
                latitude: data.values[0].lat,
                longitude: data.values[0].lon,
                label: data.label,
                properties: {
                  entity: {
                    sharedId: entity.sharedId,
                    title: entity.title,
                    template: entity.template,
                  },
                  templateInfo: {
                    color: entity.template.color,
                    name: entity.template.label,
                  },
                },
              },
            ]}
            label={data.label}
            translationContext={entity.template.name}
          />
        );
      }
    })}
  </dl>
);

const meta: Meta<StoryProps> = {
  title: 'Components/Metadata',
  component: MetadataDisplay,
};

type Story = StoryObj<StoryProps>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Provider store={store}>
        <MetadataDisplay entity={args.entity} />
      </Provider>
    </div>
  ),
};

const Basic = {
  ...Primary,
  args: {
    entity: {
      _id: '1',
      title: 'Simple title',
      sharedId: 'entity1',
      creationDate: { value: 1659438982222 },
      editDate: { value: 1663758775194 },
      icon: { _id: 'SMR' },
      template: {
        _id: '1',
        name: 'template1',
        label: 'Template 1',
        color: '#00000',
      },
      metadata: [
        {
          name: 'single_date',
          label: 'Single date',
          type: 'date',
          values: [{ value: 1662380774900 }],
        },
        {
          name: 'multiple_date',
          label: 'Multiple dates',
          type: 'multidate',
          values: [{ value: 1662380774900 }, { value: 1664982774900 }, { value: 1667588374900 }],
        },
        {
          name: 'date_range',
          label: 'Single date range',
          type: 'daterange',
          values: [{ value: { from: 1662380774900, to: 1662985574900 } }],
        },
        {
          name: 'multi_range',
          label: 'Multiple date ranges',
          type: 'multidaterange',
          values: [
            { value: { from: 1662380774900, to: 1662985574900 } },
            { value: { from: 1664982774900, to: 1665673974900 } },
            { value: { from: 1667588374900, to: 1668193174900 } },
          ],
        },
        {
          name: 'location_of_interes',
          label: 'Location of interest',
          type: 'geolocation',
          values: [{ value: { latitude: 44, longitud: 26 } }],
        },
        {
          name: 'related_people',
          label: 'Related people',
          type: 'relationship',
          inherited: false,
          relationshipName: 'People related to event',
          values: [
            { value: 'entityShared1', label: 'Person 1', icon: '', url: '/entity/entityShared1' },
            { value: 'entityShared2', label: 'Perons 2', icon: '', url: '/entity/entityShared2' },
          ],
          properties: {
            template: {
              _id: '2',
              name: 'template2',
              label: 'Template 2',
              color: '#11011',
            },
          },
        },
        {
          name: 'nearby_incidents',
          label: 'Nearby incidents',
          type: 'relationship',
          inherited: true,
          relationshipName: 'Incident nearby',
          values: [
            { value: { latitude: 40, longitud: 22 } },
            { value: { latitude: 46, longitud: 26 } },
          ],
          properties: {
            template: {
              _id: '3',
              name: 'template3',
              label: 'Template 3',
              color: '#1AE15',
            },
            inheritedProperty: {
              type: 'geolocation',
              name: 'place_of_incident',
              label: 'Location of incident',
            },
          },
        },
      ],
    },
  },
};

export { Basic };

export default meta;
