import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Modal } from 'V2/Components/UI/Modal';
import { Button } from 'V2/Components/UI/Button';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

const ModalStory = {
  title: 'Components/Modal',
  component: Modal,
};

const Template: ComponentStory<typeof Modal> = args => (
  <div className="tw-content">
    <div className=" w-10 h10 container">
      <Modal size={args.size}>{args.children}</Modal>
    </div>
  </div>
);

const Basic = Template.bind({});
const Warning = Template.bind({});

Basic.args = {
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
        <Button>Accept</Button>
        <Button buttonStyle="tertiary">Decline</Button>
      </Modal.Footer>
    </>
  ),
  size: 'sm',
};

Warning.args = {
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
        <Button buttonStyle="danger">Yes, I&apos;m sure</Button>
        <Button buttonStyle="tertiary">No, cancel</Button>
      </div>
    </Modal.Body>
  ),
  size: 'sm',
};

export { Basic, Warning };

export default ModalStory as ComponentMeta<typeof Modal>;
