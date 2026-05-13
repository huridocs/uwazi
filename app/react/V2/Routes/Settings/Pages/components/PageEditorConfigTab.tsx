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
import { CopyValueInput, Tabs } from '#V2/Components/UI/index.js';
import {
  EnableButtonCheckbox,
  InputField,
} from '#app/V2/Components/Forms/index.js';
import { Page } from '#V2/shared/types.js';
import { getPageUrl } from './PageListTable.js';
import { MarkdownDeprecationBanner } from './PageEditorComponents.js';

export interface PageEditorConfigTabProps {
  page: Page;
  register: UseFormRegister<Page>;
  getValues: UseFormGetValues<Page>;
  setValue: UseFormSetValue<Page>;
  errors: FieldErrors<Page>;
  showMarkdownDeprecation: boolean;
}

const PageEditorConfigTab = ({
  page,
  register,
  getValues,
  setValue,
  errors,
  showMarkdownDeprecation,
}: PageEditorConfigTabProps) => (
  <Tabs.Tab id="Config" label={<Translate>Config</Translate>}>
    <form>
      <input className="hidden" {...register('sharedId')} />
      <div className="flex flex-col max-w-2xl gap-4">
        {showMarkdownDeprecation && (
          <MarkdownDeprecationBanner
            onUpgrade={() => setValue('disableMarkdown', true, { shouldDirty: true })}
          />
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            {...register('disableMarkdown', {
              setValueAs: (v: unknown) => v === true || v === 'on',
            })}
          />
          <Translate>Render page as HTML only (disable Markdown)</Translate>
        </label>
        <div className="flex items-center gap-4">
          <Translate className="font-bold">
            Enable this page to be used as an entity view page:
          </Translate>
          <EnableButtonCheckbox {...register('entityView')} defaultChecked={page.entityView} />
        </div>

        <InputField
          id="title"
          label={<Translate>Title</Translate>}
          {...register('title', { required: true })}
          hasErrors={errors.title !== undefined}
          errorMessage={errors.title && <Translate>This field is required</Translate>}
        />

        <CopyValueInput
          value={
            !getValues('entityView') && getValues('sharedId')
              ? `/${getPageUrl(getValues('sharedId')!, getValues('title'))}`
              : ''
          }
          label={<Translate>URL</Translate>}
          className="w-full mb-4"
          id="page-url"
        />

        {getValues('sharedId') && !getValues('entityView') && (
          <Link target="_blank" to={`/${getPageUrl(getValues('sharedId')!, getValues('title'))}`}>
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
