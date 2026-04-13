import React from 'react';
import { useAtomValue } from 'jotai';
import { Tooltip as FlowbiteTooltip } from 'flowbite-react';
import { themeModeAtom } from '#V2/atoms/index.js';

type TooltipProps = React.ComponentProps<typeof FlowbiteTooltip>;

const Tooltip = ({ style, ...props }: TooltipProps) => {
  const themeMode = useAtomValue(themeModeAtom);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <FlowbiteTooltip style={style ?? (themeMode === 'dark' ? 'dark' : 'light')} {...props} />;
};

export { Tooltip };
export type { TooltipProps };
