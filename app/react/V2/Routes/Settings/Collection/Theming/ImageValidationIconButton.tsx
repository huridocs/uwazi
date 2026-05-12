import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { Tooltip } from '#V2/Components/UI/Tooltip.js';
import type { ImageFeedback } from './customUploadImagePickerLib.js';

type ImageValidationIconButtonProps = { feedback: ImageFeedback };

const ImageValidationIconButton = ({ feedback }: ImageValidationIconButtonProps) => (
  <Tooltip content={feedback.message} placement="top">
    <button
      type="button"
      className="inline-flex shrink-0 rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-theme-action-primary) focus-visible:ring-offset-1"
      aria-label={feedback.message}
      style={{
        color:
          feedback.type === 'error'
            ? 'var(--color-theme-feedback-danger)'
            : 'var(--color-theme-warning-banner-fg)',
      }}
    >
      <ExclamationTriangleIcon className="h-5 w-5 shrink-0" aria-hidden />
    </button>
  </Tooltip>
);

export { ImageValidationIconButton };
export type { ImageValidationIconButtonProps };
