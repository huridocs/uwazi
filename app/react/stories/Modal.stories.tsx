import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Modal } from 'V2/Components/UI/Modal';
import { Button } from 'V2/Components/UI/Button';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
};

type Story = StoryObj<typeof Modal>;

const ModalStory: Story = {
  render: args => (
    <div className="tw-content">
      <div className="container w-10 h10">
        <Modal size={args.size}>{args.children}</Modal>
      </div>
    </div>
  ),
};

const Basic = {
  ...ModalStory,
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
          <Button buttonStyle="tertiary" className="grow">
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
  ...ModalStory,
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
        <div className="flex justify-center gap-4">
          <Button buttonStyle="tertiary" className="grow">
            No, cancel
          </Button>
          <Button buttonStyle="danger" className="grow">
            Yes, I&apos;m sure
          </Button>
        </div>
      </Modal.Body>
    ),
    size: 'sm',
  },
};

export { Basic, Warning };

export default meta;
