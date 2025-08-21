/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Tooltip } from 'flowbite-react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';

type TooltipProps = { content: 'accuracy' };

const Contents = ({ content }: TooltipProps) => {
  switch (content) {
    case 'accuracy':
      return (
        <Translate translationKey="Accuracy tooltip">
          Accuracy is defined by the amount of matches vs mismatches for labeled samples that have
          been processed.
        </Translate>
      );

    default:
      return '';
  }
};

const StatsTooltip = ({ content }: TooltipProps) => (
  <Tooltip
    content={<Contents content={content} />}
    arrow
    animation="duration-100"
    // eslint-disable-next-line react/style-prop-object
    style="light"
    className="shadow-xl max-w-52"
  >
    <InformationCircleIcon className="w-4" />
  </Tooltip>
);

export { StatsTooltip };
