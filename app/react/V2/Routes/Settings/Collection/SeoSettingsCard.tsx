/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { InputField, Textarea } from '#V2/Components/Forms/index.js';
import { Card, SectionHeading, Tooltip } from '#V2/Components/UI/index.js';
import { Translate } from '#app/I18N/index.js';
import { ClientSettings } from '#app/apiResponseTypes.js';
import { FileType } from '#shared/types/fileType.js';
import * as tips from './collectionSettingsTips.js';
import { CustomUploadImagePicker } from './Theming/CustomUploadImagePicker.js';
import { ogImageSizeRule } from './Theming/brandImageUploadRules.js';

type SeoSettingsCardProps = {
  register: UseFormRegister<ClientSettings>;
  watch: UseFormWatch<ClientSettings>;
  setValue: UseFormSetValue<ClientSettings>;
  customUploadFiles: FileType[];
};

const labelWithTip = (label: React.ReactNode, tip: React.ReactNode) => (
  <span className="flex gap-4">
    {label}
    <Tooltip content={tip} placement="right">
      <QuestionMarkCircleIcon className="h-5 w-5 text-ink-muted" />
    </Tooltip>
  </span>
);

const SeoSettingsCard = ({
  register,
  watch,
  setValue,
  customUploadFiles,
}: SeoSettingsCardProps) => (
  <div data-testid="settings-seo">
    <Card className="mb-4" title={<Translate>SEO</Translate>}>
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        <div className="sm:col-span-2">
          <InputField
            id="seo-page-title"
            label={labelWithTip(<Translate>Page title</Translate>, tips.seoPageTitle)}
            {...register('seo.title')}
            value={watch('seo.title') ?? ''}
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            id="seo-meta-description"
            rows={3}
            resize="vertical"
            label={labelWithTip(<Translate>Meta description</Translate>, tips.seoMetaDescription)}
            {...register('seo.description')}
            value={watch('seo.description') ?? ''}
          />
        </div>
        <div className="sm:col-span-2">
          <SectionHeading>
            <Translate>Open Graph</Translate>
          </SectionHeading>
        </div>
        <div className="sm:col-span-2">
          <InputField
            id="seo-og-title"
            label={labelWithTip(<Translate>og:title</Translate>, tips.seoOgTitle)}
            {...register('seo.ogTitle')}
            value={watch('seo.ogTitle') ?? ''}
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            id="seo-og-description"
            rows={3}
            resize="vertical"
            label={labelWithTip(<Translate>og:description</Translate>, tips.seoOgDescription)}
            {...register('seo.ogDescription')}
            value={watch('seo.ogDescription') ?? ''}
          />
        </div>
        <CustomUploadImagePicker
          id="seo-og-image"
          label={labelWithTip(<Translate>og:image</Translate>, tips.seoOgImage)}
          registerProps={register('seo.ogImage')}
          value={watch('seo.ogImage')}
          onChange={v => setValue('seo.ogImage', v, { shouldDirty: true })}
          files={customUploadFiles}
          selectButtonTitle={<Translate>Select Open Graph image</Translate>}
          recommendedSize="1200x630 px"
          sizeRule={ogImageSizeRule}
        />
      </div>
    </Card>
  </div>
);

export { SeoSettingsCard };
export type { SeoSettingsCardProps };
