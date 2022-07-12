import React from 'react';
import { RenderResult } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { PDFUpload } from '../PDFUpload';

describe('PDF upload', () => {
  let reduxStore = {};
  let renderResult: RenderResult;

  const render = () => {
    reduxStore = {
      ...defaultState,
    };
    ({ renderResult } = renderConnectedContainer(<PDFUpload />, () => reduxStore));
  };
});
