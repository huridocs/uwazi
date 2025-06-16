import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { TruncatedText } from 'V2/Components/UI';

const meta: Meta<typeof TruncatedText> = {
  title: 'Components/TruncatedText',
  component: TruncatedText,
};

type Story = StoryObj<typeof TruncatedText>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <div className="flex gap-4 flex-col">
        <TruncatedText maxLength={args.maxLength}>{args.children}</TruncatedText>

        <TruncatedText maxLength={args.maxLength}>Short text with not wrapping</TruncatedText>

        <TruncatedText maxLength={args.maxLength}>
          <div className="px-1 bg-primary-400 text-white">
            Short text with no wrapping and custom styles
          </div>
        </TruncatedText>

        <TruncatedText maxLength={args.maxLength}>
          <div className="px-1 bg-orange-400 text-white">{args.children}</div>
        </TruncatedText>
      </div>
    </div>
  ),
};

const Basic = {
  ...Primary,
  args: {
    children: (
      <span className="italic">
        &quot;At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium
        voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati
        cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id
        est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam
        libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod
        maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
        Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut
        et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a
        sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis
        doloribus asperiores repellat.&quot;
      </span>
    ),
    maxLength: 100,
  },
};

export { Basic };

export default meta;
