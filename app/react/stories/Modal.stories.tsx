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

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Modal size={args.size}>{args.children}</Modal>
    </div>
  ),
};

const ModalContent = () => {
  const contents: React.ReactNode[] = [];

  for (let index = 1; index < 8; index += 1) {
    contents.push(
      <>
        <h1 className="font-bold">Item {index}</h1>
        <p className="mb-1">
          Fusce id mi eu mauris bibendum dignissim nec in sem. Sed ultrices varius mauris quis
          placerat. Donec imperdiet sodales diam sed imperdiet. Aenean a nisl venenatis lectus
          mattis pellentesque. Duis fermentum ante a ultricies feugiat. Proin dapibus luctus purus
          id viverra. Aenean a aliquet nibh. Aenean facilisis justo quis sem auctor, nec mollis
          tortor placerat. Cras eget enim mollis, mollis risus gravida, pharetra risus. Mauris
          dapibus malesuada mi, quis ornare felis imperdiet eget. Donec sed quam non dolor sodales
          hendrerit. Aenean suscipit, velit sed laoreet cursus, ante odio tristique lectus, a porta
          eros felis eu sem. Curabitur eu gravida dolor. Ut iaculis lacus vitae libero viverra
          interdum. Phasellus ac est consectetur, malesuada nisl nec, blandit lorem.
        </p>
        <hr className="mb-2" />
      </>
    );
  }

  return <>{contents.map(content => content)}</>;
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
          <ModalContent />
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
