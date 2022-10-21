/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { LoadingWrapper } from '../LoadingWrapper';

describe('LoadingWrapper', () => {
  it('should display a loading bar when the loading prop is set to true', () => {
    const { container } = render(<LoadingWrapper isLoading />);
    expect(container).toMatchSnapshot();
  });

  it.each([
    'Simple text',
    <p>Simple HTML</p>,
    [<h1 key="1">Multiple children</h1>, <p key="2">second child</p>],
    undefined,
  ])('should render children when loading prop is set to false', children => {
    const { container } = render(<LoadingWrapper isLoading={false}>{children}</LoadingWrapper>);
    expect(container).toMatchSnapshot();
  });
});
