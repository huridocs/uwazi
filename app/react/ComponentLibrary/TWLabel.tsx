import React from 'react';
import { ListGroup } from 'flowbite-react';

const TWLabel = () => (
  <div className="tw-content">
    <div className="text-xl font-medium text-red-700 bg-purple-700">ChitChat</div>
    <div className="w-48">
      <ListGroup>
        <ListGroup.Item>Profile</ListGroup.Item>
        <ListGroup.Item>Settings</ListGroup.Item>
        <ListGroup.Item>Messages</ListGroup.Item>
        <ListGroup.Item>Download</ListGroup.Item>
      </ListGroup>
    </div>
  </div>
);
export { TWLabel };
