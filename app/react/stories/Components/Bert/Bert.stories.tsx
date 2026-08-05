/* eslint-disable import/exports-last, import/no-default-export, no-empty-function, react/jsx-props-no-spreading, react/no-multi-comp */
import React, { useMemo } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { createStore, Provider } from 'jotai';
import { AskBertButton } from '#V2/Components/AIAssistant/AskBertButton.js';
import { BertHost } from '#V2/Components/AIAssistant/BertHost.js';
import { BertModal } from '#V2/Components/AIAssistant/BertModal.js';
import { useBertState } from '#V2/Components/AIAssistant/useBertState.js';
import {
  STORY_BERT_MESSAGES,
  STORY_CONTEXT_CHIPS,
} from '#V2/Components/AIAssistant/mockBertData.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';

const meta: Meta<typeof BertHost> = {
  title: 'Components/Bert',
  component: BertHost,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj<typeof BertHost>;

const DocumentBackdrop = ({ children }: { children: React.ReactNode }) => (
  <div className="tw-content relative min-h-[44rem] bg-vellum" data-storybook-theme-checks>
    <div className="pointer-events-none p-8 opacity-40">
      <p className="text-lg font-semibold text-ink">Case of Velásquez-Rodríguez v. Honduras</p>
      <p className="mt-4 max-w-2xl text-sm text-ink-secondary">
        Inter-American Court of Human Rights judgment excerpt (background mock).
      </p>
    </div>
    {children}
  </div>
);

const MockHeaderBar = () => (
  <header
    className="header-bar flex flex-col border-b border-border-soft bg-paper"
    data-uwazi-header
  >
    <div className="flex min-h-13 items-center justify-end gap-2 px-5">
      <AskBertButton />
    </div>
  </header>
);

const MockModalStory = ({
  mockReplies = true,
  replyScenario = 'normal' as const,
}: {
  mockReplies?: boolean;
  replyScenario?: 'normal' | 'slow' | 'error';
}) => {
  const bertState = useBertState({
    open: true,
    mockReplies,
    replyScenario,
    initialMessages: STORY_BERT_MESSAGES,
    initialContextChips: STORY_CONTEXT_CHIPS,
  });

  return <BertModal open onClose={() => {}} {...bertState} />;
};

const Basic: Story = {
  render: () => (
    <DocumentBackdrop>
      <MockModalStory />
    </DocumentBackdrop>
  ),
};

const PlaygroundStory = () => {
  const store = useMemo(() => {
    const nextStore = createStore();
    nextStore.set(settingsAtom, {
      features: {
        aiAssistant: true,
      },
    });
    return nextStore;
  }, []);

  return (
    <Provider store={store}>
      <DocumentBackdrop>
        <MockHeaderBar />
        <BertHost
          mockReplies
          initialMessages={STORY_BERT_MESSAGES}
          initialContextChips={STORY_CONTEXT_CHIPS}
        />
      </DocumentBackdrop>
    </Provider>
  );
};

const Playground: Story = {
  render: () => <PlaygroundStory />,
};

export { Basic, Playground };
