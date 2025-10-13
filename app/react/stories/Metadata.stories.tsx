import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { MetadataDisplay } from 'V2/Components/Metadata';
import { settingsAtom } from 'V2/atoms';
import { EntityAdapterProcessor } from 'V2/application/services/processors/EntityAdapterProcessor';
import { rawEntity, processingContext } from './fixtures/MetadataDisplayFixtures';

const store = createStore();
store.set(settingsAtom, { mapLayers: ['Streets', 'Hybrid', 'Satellite'] });

const meta: Meta<typeof MetadataDisplay> = {
  title: 'Components/Metadata',
  component: MetadataDisplay,
};

type Story = StoryObj<typeof MetadataDisplay>;
const entityAdapterProcessor = new EntityAdapterProcessor(processingContext);
const { entity } = entityAdapterProcessor.processEntity(rawEntity);

const Primary: Story = {
  render: args => {
    return (
      <div className="tw-content">
        <BrowserRouter>
          <Provider store={store}>
            <MetadataDisplay entity={args.entity} />
          </Provider>
        </BrowserRouter>
      </div>
    );
  },
};

const Basic = {
  ...Primary,
  args: { entity },
};

export { Basic };

export default meta;

/* const entity: EntitySchema = {
  _id: '1',
  title: 'Simple title',
  sharedId: 'entity1',
  language: 'en',
  creationDate: {
    values: [{ value: 1659438982222, label: 'August 2, 2022' }],
    name: 'creationDate',
    type: 'date',
    label: 'Creation Date',
  },
  editDate: {
    values: [{ value: 1663758775194, label: 'September 20, 2022' }],
    name: 'editDate',
    type: 'date',
    label: 'Edit Date',
  },
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
      values: [{ value: { latitude: 44, longitude: 26 } }],
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
        { value: 'incident1', label: 'Incident at 40°N, 22°E', url: '/entity/incident1' },
        { value: 'incident2', label: 'Incident at 46°N, 26°E', url: '/entity/incident2' },
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
    {
      name: 'video_of_event',
      label: 'Media file',
      type: 'media',
      values: [{ value: '/short-video.mp4', alt: 'Alternative text' }],
    },
    {
      name: 'selected_image',
      label: 'An Image',
      type: 'image',
      values: [{ value: '/short-video-thumbnail.jpg', alt: 'Alternative text for image' }],
    },
    {
      type: 'preview',
      label: 'Preview of main document',
      name: 'preview_document',
      values: [{ value: '/batman.jpg', alt: 'Alternative text pdf preview' }],
    },
    {
      type: 'text',
      label: 'Simple text',
      name: 'simple_text',
      values: [{ value: 'Sample simple text' }],
    },
    {
      type: 'markdown',
      label: 'Markdown (HTML example)',
      name: 'markdown_html',
      values: [
        {
          value:
            '<p>This <b>Markdown</b> field includes <i>simple HTML</i> tags and a <a href="https://example.com">link</a>.</p>',
        },
      ],
    },
    {
      type: 'markdown',
      label: 'Markdown (syntax example)',
      name: 'markdown_syntax',
      values: [
        {
          value: '**Bold text**, *italic text*, and a [link](https://example.com)',
        },
      ],
    },
  ],
}; */
