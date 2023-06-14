import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Modal } from 'V2/Components/UI/Modal';
import { Button } from 'V2/Components/UI/Button';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { GeneratedContent } from './helpers/GeneratedContent';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
};

type Story = StoryObj<typeof Modal>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Modal size={args.size}>{args.children}</Modal>
    </div>
  ),
};

const Basic = {
  ...Primary,
  args: {
    children: (
      <>
        <Modal.Header>
          <h3 className="text-xl font-medium text-gray-900">Do you want to continue?</h3>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam lacinia lorem non est
          ornare, a volutpat massa interdum.
        </Modal.Body>
        <Modal.Footer>
          <Button styling="light" className="grow">
            Decline
          </Button>
          <Button className="grow">Accept</Button>
        </Modal.Footer>
      </>
    ),
    size: 'sm',
  },
};

const Warning = {
  ...Primary,
  args: {
    children: (
      <Modal.Body>
        <div className="h-6">
          <Modal.CloseButton className="float-right" />
        </div>
        <div className="flex justify-center w-full">
          <InformationCircleIcon className="h-10 text-gray-400" />
        </div>
        <h3 className="mb-5 text-lg font-normal text-gray-500">
          Are you sure you want to delete this product?
        </h3>
        <div className="flex gap-4 justify-center">
          <Button styling="light" className="grow">
            No, cancel
          </Button>
          <Button color="error" className="grow">
            Yes, I&apos;m sure
          </Button>
        </div>
      </Modal.Body>
    ),
    size: 'sm',
  },
};

const LargeContent = {
  ...Primary,
  args: {
    children: (
      <>
        <Modal.Header>
          <h3 className="text-xl font-medium text-gray-900">Information modal</h3>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>
          <GeneratedContent />
        </Modal.Body>
        <Modal.Footer>
          <Button styling="light" className="grow">
            Close
          </Button>
        </Modal.Footer>
      </>
    ),
    size: 'xxxl',
  },
};

export { Basic, Warning, LargeContent };

export default meta;
