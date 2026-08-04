import React from 'react';
import { useAtomValue } from 'jotai';
import { Tooltip as FlowbiteTooltip } from 'flowbite-react';
import { effectiveThemeModeAtom } from '#V2/atoms/index.js';

type FlowbiteTooltipProps = React.ComponentProps<typeof FlowbiteTooltip>;
type TooltipSize = 'sm' | 'nano';

type TooltipProps = Omit<FlowbiteTooltipProps, 'theme'> & {
  size?: TooltipSize;
  theme?: FlowbiteTooltipProps['theme'];
};

const sizeBase: Record<TooltipSize, string> = {
  sm: 'absolute z-10 inline-block rounded-lg px-3 py-2 text-sm font-medium',
  nano: 'absolute z-10 inline-block rounded-md px-2 py-1 text-[10px] font-medium leading-snug',
};

const lightSurface = 'tooltip-light-surface';

const Tooltip = ({ style, theme, placement = 'top', size = 'sm', ...props }: TooltipProps) => {
  const themeMode = useAtomValue(effectiveThemeModeAtom);

  return (
    <FlowbiteTooltip
      placement={placement}
      style={style ?? (themeMode === 'dark' ? 'dark' : 'light')}
      theme={{
        ...theme,
        base: theme?.base ?? sizeBase[size],
        style: {
          light: lightSurface,
          ...theme?.style,
        },
        arrow: {
          placement: '-6px',
          ...theme?.arrow,
          style: {
            light: 'bg-white',
            dark: 'bg-gray-900 dark:bg-gray-700',
            auto: 'bg-white dark:bg-gray-700',
            ...theme?.arrow?.style,
          },
        },
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
};

export { Tooltip };
export type { TooltipProps, TooltipSize };
