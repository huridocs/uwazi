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
        <Translate>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla consectetur lacinia tortor
          vel tempus. In sed eleifend enim, auctor rhoncus tellus. Aenean vitae vestibulum diam.
          Quisque dapibus in quam eu mattis. Donec vehicula erat ligula, vitae auctor lorem luctus
          in. In porttitor nisi vitae ante pretium mattis.
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
