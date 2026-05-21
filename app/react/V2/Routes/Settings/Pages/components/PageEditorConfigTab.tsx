import React from 'react';
import { Link } from 'react-router';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import type {
  FieldErrors,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { CopyValueInput, Tabs, ToggleButton } from '#V2/Components/UI/index.js';
import { InputField } from '#app/V2/Components/Forms/index.js';
import { Page } from '#V2/shared/types.js';
import { getPageUrlSlugOnly, getPageUrlWithSharedId } from './pageUrls.js';
import { MarkdownDeprecationBanner } from './PageEditorComponents.js';

export interface PageEditorConfigTabProps {
  page: Page;
  register: UseFormRegister<Page>;
  getValues: UseFormGetValues<Page>;
  setValue: UseFormSetValue<Page>;
  errors: FieldErrors<Page>;
  showMarkdownDeprecation: boolean;
  entityView: boolean;
  onEntityViewToggle: () => void;
}

const PageEditorConfigTab = ({
  page,
  register,
  getValues,
  setValue,
  errors,
  showMarkdownDeprecation,
  entityView,
  onEntityViewToggle,
}: PageEditorConfigTabProps) => (
  <Tabs.Tab id="Configuration" label={<Translate>Configuration</Translate>}>
    <form>
      <input className="hidden" {...register('sharedId')} />
      <div className="flex flex-col max-w-2xl gap-4">
        {showMarkdownDeprecation && (
          <MarkdownDeprecationBanner
            onUpgrade={() => setValue('markdownSupport', false, { shouldDirty: true })}
          />
        )}
        <ToggleButton checked={entityView} onToggle={onEntityViewToggle}>
          <Translate className="text-sm font-semibold text-ink">
            Enable this page to be used as an entity view page
          </Translate>
        </ToggleButton>

        <InputField
          id="title"
          label={<Translate>Title</Translate>}
          {...register('title', { required: true })}
          hasErrors={errors.title !== undefined}
          errorMessage={errors.title && <Translate>This field is required</Translate>}
        />

        <InputField
          id="slug"
          label={<Translate>Slug</Translate>}
          {...register('slug', { required: true })}
          hasErrors={errors.slug !== undefined}
          errorMessage={errors.slug && <Translate>This field is required</Translate>}
        />

        {getValues('sharedId') && !getValues('entityView') && getValues('slug') && (
          <>
            <CopyValueInput
              value={`/${getPageUrlWithSharedId(getValues('sharedId')!, getValues('slug')!)}`}
              label={<Translate>URL (with ID)</Translate>}
              className="w-full"
              id="page-url-with-id"
            />
            <CopyValueInput
              value={`/${getPageUrlSlugOnly(getValues('slug')!)}`}
              label={<Translate>URL (slug only)</Translate>}
              className="w-full mb-4"
              id="page-url-slug-only"
            />
          </>
        )}

        {getValues('sharedId') && !getValues('entityView') && getValues('slug') && (
          <Link
            target="_blank"
            to={`/${getPageUrlWithSharedId(getValues('sharedId')!, getValues('slug')!)}`}
          >
            <div className="flex gap-2 hover:font-bold hover:cursor-pointer">
              <ArrowTopRightOnSquareIcon className="w-4" />
              <Translate className="underline hover:text-primary-700">View page</Translate>
            </div>
          </Link>
        )}
      </div>
    </form>
  </Tabs.Tab>
);

export { PageEditorConfigTab };
