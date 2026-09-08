import React from 'react';
import preview from '#storybook/preview';
import { storyExtend } from '#app/stories/storyExtend.js';
import { createStore, Provider } from 'jotai';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { templatesAtom } from '#V2/atoms/index.js';

const templates = [
  {
    _id: 'template-case',
    name: 'Case',
    color: '#A4CAFE',
  },
  {
    _id: 'template-light-blue',
    name: 'Case',
    color: '#BDD7F5',
  },
  {
    _id: 'template-red',
    name: 'Order of the judge',
    color: '#F5BDBD',
  },
  {
    _id: 'template-purple',
    name: 'IACourt Judge',
    color: '#D7BDF5',
  },
  {
    _id: 'template-dark',
    name: 'Dark Template',
    color: '#2F0F06',
  },
  {
    _id: 'template-green',
    name: 'Green Template',
    color: '#BDF5BD',
  },
];

const store = createStore();
store.set(templatesAtom, templates);

const meta = preview.meta({
  title: 'EntityViewer/TemplateLabel',
  component: TemplateLabel,
});

const Primary = meta.story({
  render: args => (
    <div className="tw-content">
      <Provider store={store}>
        <TemplateLabel templateId={args.templateId} />
      </Provider>
    </div>
  ),
});

const Basic = storyExtend(Primary, {
  args: {
    templateId: 'template-case',
  },
});

const LightBlue = storyExtend(Primary, {
  args: {
    templateId: 'template-light-blue',
  },
});

const Red = storyExtend(Primary, {
  args: {
    templateId: 'template-red',
  },
});

const Purple = storyExtend(Primary, {
  args: {
    templateId: 'template-purple',
  },
});

const Dark = storyExtend(Primary, {
  args: {
    templateId: 'template-dark',
  },
});

const Green = storyExtend(Primary, {
  args: {
    templateId: 'template-green',
  },
});
export { Basic, LightBlue, Red, Purple, Dark, Green };
