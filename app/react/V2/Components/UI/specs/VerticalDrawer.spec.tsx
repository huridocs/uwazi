/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VerticalDrawer } from '../VerticalDrawer';

describe('VerticalDrawer', () => {
  const defaultProps = {
    title: 'Test Drawer',
    children: <div data-testid="drawer-content">Drawer content</div>,
  };

  it('should render with default closed state', () => {
    render(<VerticalDrawer {...defaultProps} />);
    expect(screen.getByText('Test Drawer')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.queryByTestId('drawer-content')).not.toBeInTheDocument();
  });

  it('should render with defaultOpen prop set to true', () => {
    render(<VerticalDrawer {...defaultProps} defaultOpen />);
    expect(screen.getByText('Test Drawer')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
  });

  it('should toggle content visibility when button is clicked', () => {
    render(<VerticalDrawer {...defaultProps} />);
    const button = screen.getByText('Open');
    expect(screen.queryByTestId('drawer-content')).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByTestId('drawer-content')).not.toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });
});
