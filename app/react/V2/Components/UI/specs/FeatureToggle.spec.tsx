/**
 * @jest-environment jsdom
 */
/* eslint-disable max-statements */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider, useSetAtom } from 'jotai';
import { settingsAtom } from 'V2/atoms/settingsAtom';
import { FeatureToggle } from '../FeatureToggle';

// Test wrapper component to provide atom context and set initial values
const TestWrapper = ({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: any;
}) => {
  // eslint-disable-next-line react/no-multi-comp
  const SetSettings = () => {
    const setSettings = useSetAtom(settingsAtom);
    React.useEffect(() => {
      if (initialSettings) {
        setSettings(initialSettings);
      }
    }, [setSettings]);
    return null;
  };

  return (
    <Provider>
      <SetSettings />
      {children}
    </Provider>
  );
};

describe('FeatureToggle', () => {
  it('should render children when feature is enabled', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {
            testFeature: true,
          },
        }}
      >
        <FeatureToggle feature="testFeature">
          <div data-testid="test-content">Feature is enabled</div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Feature is enabled')).toBeInTheDocument();
  });

  it('should not render children when feature is disabled', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {
            testFeature: false,
          },
        }}
      >
        <FeatureToggle feature="testFeature">
          <div data-testid="test-content">Feature is disabled</div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Feature is disabled')).not.toBeInTheDocument();
  });

  it('should not render children when feature is not defined in settings', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {},
        }}
      >
        <FeatureToggle feature="undefinedFeature">
          <div data-testid="test-content">Undefined feature content</div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Undefined feature content')).not.toBeInTheDocument();
  });

  it('should not render children when features object is undefined', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: undefined,
        }}
      >
        <FeatureToggle feature="testFeature">
          <div data-testid="test-content">Features undefined content</div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.queryByTestId('test-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Features undefined content')).not.toBeInTheDocument();
  });

  it('should render complex nested children when feature is enabled', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {
            complexFeature: true,
          },
        }}
      >
        <FeatureToggle feature="complexFeature">
          <div>
            <h1>Complex Feature</h1>
            <p>This is a complex nested structure</p>
            <button>Click me</button>
          </div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.getByText('Complex Feature')).toBeInTheDocument();
    expect(screen.getByText('This is a complex nested structure')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle multiple feature toggles independently', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {
            feature1: true,
            feature2: false,
            feature3: true,
          },
        }}
      >
        <FeatureToggle feature="feature1">
          <div data-testid="feature1">Feature 1 content</div>
        </FeatureToggle>
        <FeatureToggle feature="feature2">
          <div data-testid="feature2">Feature 2 content</div>
        </FeatureToggle>
        <FeatureToggle feature="feature3">
          <div data-testid="feature3">Feature 3 content</div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.getByTestId('feature1')).toBeInTheDocument();
    expect(screen.queryByTestId('feature2')).not.toBeInTheDocument();
    expect(screen.getByTestId('feature3')).toBeInTheDocument();
  });

  it('should handle empty children gracefully', () => {
    const { container } = render(
      <TestWrapper
        initialSettings={{
          features: {
            testFeature: true,
          },
        }}
      >
        <FeatureToggle feature="testFeature">{null}</FeatureToggle>
      </TestWrapper>
    );

    // Should not throw any errors and should render nothing
    expect(container.textContent).toBe('');
  });

  it('should handle string children when feature is enabled', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {
            testFeature: true,
          },
        }}
      >
        <FeatureToggle feature="testFeature">Simple string content</FeatureToggle>
      </TestWrapper>
    );

    expect(screen.getByText('Simple string content')).toBeInTheDocument();
  });

  it('should render children when nested feature is enabled', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {
            featureGroup: {
              active: true,
              inactive: false,
            },
          },
        }}
      >
        <FeatureToggle feature="featureGroup.active">
          <div data-testid="nested-feature">Nested feature is enabled</div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.getByTestId('nested-feature')).toBeInTheDocument();
    expect(screen.getByText('Nested feature is enabled')).toBeInTheDocument();
  });

  it('should not render children when nested feature is disabled', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {
            featureGroup: {
              active: false,
            },
          },
        }}
      >
        <FeatureToggle feature="featureGroup.active">
          <div data-testid="nested-feature">Nested feature is disabled</div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.queryByTestId('nested-feature')).not.toBeInTheDocument();
    expect(screen.queryByText('Nested feature is disabled')).not.toBeInTheDocument();
  });

  it('should not render children when nested feature path does not exist', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {
            featureGroup: {
              active: true,
            },
          },
        }}
      >
        <FeatureToggle feature="featureGroup.nonexistent">
          <div data-testid="nonexistent-feature">Nonexistent feature content</div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.queryByTestId('nonexistent-feature')).not.toBeInTheDocument();
    expect(screen.queryByText('Nonexistent feature content')).not.toBeInTheDocument();
  });

  it('should handle deeply nested features', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {
            level1: {
              level2: {
                level3: {
                  enabled: true,
                  disabled: false,
                },
              },
            },
          },
        }}
      >
        <FeatureToggle feature="level1.level2.level3.enabled">
          <div data-testid="deep-feature">Deeply nested feature is enabled</div>
        </FeatureToggle>
        <FeatureToggle feature="level1.level2.level3.disabled">
          <div data-testid="deep-feature-disabled">Deeply nested feature is disabled</div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.getByTestId('deep-feature')).toBeInTheDocument();
    expect(screen.getByText('Deeply nested feature is enabled')).toBeInTheDocument();
    expect(screen.queryByTestId('deep-feature-disabled')).not.toBeInTheDocument();
    expect(screen.queryByText('Deeply nested feature is disabled')).not.toBeInTheDocument();
  });

  it('should handle mixed nested and flat features', () => {
    render(
      <TestWrapper
        initialSettings={{
          features: {
            flatFeature: true,
            nestedGroup: {
              nestedFeature: true,
            },
          },
        }}
      >
        <FeatureToggle feature="flatFeature">
          <div data-testid="flat-feature">Flat feature content</div>
        </FeatureToggle>
        <FeatureToggle feature="nestedGroup.nestedFeature">
          <div data-testid="nested-feature">Nested feature content</div>
        </FeatureToggle>
      </TestWrapper>
    );

    expect(screen.getByTestId('flat-feature')).toBeInTheDocument();
    expect(screen.getByText('Flat feature content')).toBeInTheDocument();
    expect(screen.getByTestId('nested-feature')).toBeInTheDocument();
    expect(screen.getByText('Nested feature content')).toBeInTheDocument();
  });
});
