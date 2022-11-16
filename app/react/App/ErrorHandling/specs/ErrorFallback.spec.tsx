/**
 * @jest-environment jsdom
 */
import React from 'react';
import { RenderResult, screen } from '@testing-library/react';
import { defaultState, renderConnectedContainer } from 'app/utils/test/renderConnected';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';

describe('ErrorFallback', () => {
  let renderResult: RenderResult;
  const render = (props: { error: { name: string; message: string } }) => {
    ({ renderResult } = renderConnectedContainer(<ErrorFallback {...props} />, () => defaultState));
  };
  it('should show the error message when it is passed', () => {
    const props = { error: { name: 'error name', message: 'error details' } };
    render(props);
    const errorName = screen.getByText('error name');
    expect(errorName).toBeInTheDocument();
    expect(errorName.parentElement!.className).toEqual('error-message-lg');
    const errorDetails = screen.getByText('error details');
    expect(errorDetails).toBeInTheDocument();
    expect(errorDetails.parentElement!.className).toEqual('error-details');
  });

  it('should show additional error info if code is 500', () => {
    const props = { error: { name: '', message: '', code: '500', requestId: '1234' } };
    render(props);
    const requestId = screen.getByText('1234');
    expect(requestId.className).toEqual('error-message-sm');
    const code = screen.getByText('500');
    expect(code).toBeInTheDocument();
    expect(code.className).toEqual('error-code');
  });

  it('should not show requestId is code is different than 500', () => {
    const props = { error: { name: '', message: '', code: '400', requestId: '1234' } };
    render(props);
    const code = screen.getByText('400');
    expect(code).toBeInTheDocument();
    expect(code.className).toEqual('error-code');
    expect(renderResult.container.getElementsByClassName('error-message-sm').length).toBe(0);
  });

  it('should show a generic message is message is not passed', () => {
    const props = { error: { name: '', message: '' } };
    render(props);
    const message = screen.getByText('Something went wrong');
    expect(message).toBeInTheDocument();
    expect(message.parentElement!.className).toEqual('error-message-lg');
    expect(renderResult.container.getElementsByClassName('error-message-sm').length).toBe(0);
  });
});
