import React from 'react';
import { useAtomValue } from 'jotai';
import { Tooltip as FlowbiteTooltip } from 'flowbite-react';
import { effectiveThemeModeAtom } from '#V2/atoms/index.js';

type FlowbiteTooltipProps = React.ComponentProps<typeof FlowbiteTooltip>;
type TooltipSize = 'sm' | 'nano';
type TooltipTone = 'theme' | 'ink';

type TooltipProps = Omit<FlowbiteTooltipProps, 'theme'> & {
  size?: TooltipSize;
  theme?: FlowbiteTooltipProps['theme'];
  tone?: TooltipTone;
};

const sizeBase: Record<TooltipSize, string> = {
  sm: 'absolute z-10 inline-block rounded-lg px-3 py-2 text-sm font-medium',
  nano: 'absolute z-10 inline-block rounded-md px-2 py-1 text-micro font-medium leading-snug',
};

const Tooltip = ({
  style,
  theme,
  placement = 'top',
  size = 'sm',
  tone = 'theme',
  ...props
}: TooltipProps) => {
  const themeMode = useAtomValue(effectiveThemeModeAtom);
  const ink = tone === 'ink' || themeMode === 'dark';

  return (
    <FlowbiteTooltip
      placement={placement}
      style={ink ? 'dark' : (style ?? 'light')}
      theme={{
        ...theme,
        base: theme?.base ?? sizeBase[size],
        style: {
          light: 'tooltip-light-surface',
          dark: 'bg-ink text-parchment',
          ...theme?.style,
        },
        arrow: {
          base: 'absolute z-10 h-2 w-2 rotate-45',
          placement: '-4px',
          ...theme?.arrow,
          style: {
            light: 'bg-paper',
            dark: 'bg-ink',
            auto: 'bg-paper',
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
export type { TooltipProps, TooltipSize, TooltipTone };
