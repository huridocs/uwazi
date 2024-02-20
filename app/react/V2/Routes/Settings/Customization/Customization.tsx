import React from 'react';
import { LoaderFunction } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';

const customizationLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async () => {
    return undefined;
  };

const Customization = () => {
  return <div>Customization</div>;
};

export { Customization, customizationLoader };
