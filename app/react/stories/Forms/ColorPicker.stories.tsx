import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { action } from '@storybook/addon-actions';
import { ColorPicker } from 'app/V2/Components/Forms';

const meta: Meta<typeof ColorPicker> = {
  title: 'Forms/ColorPicker',
  component: ColorPicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {
  args: {
    name: 'color',
    value: '#C03B22',
  },
};

export const WithCustomColor: Story = {
  args: {
    name: 'color',
    value: '#3F51B5',
  },
};

export const WithError: Story = {
  args: {
    name: 'color',
    value: '#C03B22',
    hasErrors: true,
  },
};

export const WithOnChange: Story = {
  args: {
    name: 'color',
    value: '#C03B22',
    onChange: action('color changed'),
  },
};
