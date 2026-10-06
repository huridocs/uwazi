/**
 * @jest-environment jsdom
 */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { ClientSettings } from '#app/apiResponseTypes.js';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import { SeoSettingsCard } from '../SeoSettingsCard.js';

const Wrapper = ({ defaults }: { defaults?: ClientSettings['seo'] }) => {
  const { register, watch, setValue } = useForm<ClientSettings>({
    defaultValues: { seo: defaults ?? {} },
  });

  return (
    <TestAtomStoreProvider initialValues={[]}>
      <TestRouterContext>
        <SeoSettingsCard
          register={register}
          watch={watch}
          setValue={setValue}
          customUploadFiles={[]}
        />
      </TestRouterContext>
    </TestAtomStoreProvider>
  );
};

describe('SeoSettingsCard', () => {
  it('should render page title, meta description and Open Graph fields', async () => {
    render(
      <Wrapper
        defaults={{
          title: 'Page title value',
          description: 'Meta description value',
          ogTitle: 'OG title value',
          ogDescription: 'OG description value',
        }}
      />
    );

    expect(await screen.findByRole('textbox', { name: /Page title/ })).toHaveValue(
      'Page title value'
    );
    expect(screen.getByRole('textbox', { name: /Meta description/ })).toHaveValue(
      'Meta description value'
    );
    expect(screen.getByRole('textbox', { name: /og:title/ })).toHaveValue('OG title value');
    expect(screen.getByRole('textbox', { name: /og:description/ })).toHaveValue(
      'OG description value'
    );
    expect(screen.getByText('og:image')).toBeInTheDocument();
  });
});
