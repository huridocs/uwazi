import React, { useRef } from 'react';
import { Translate } from '#app/I18N/index.js';
import { Checkbox } from '#V2/Components/Forms/Checkbox.js';
import { InputColorPicker } from '#V2/Components/Forms/InputColorPicker.js';

type ThemeColorsSectionProps = {
  background?: string;
  foreground?: string;
  onChange: (patch: { background?: string; foreground?: string }) => void;
};

const ThemeColorsSection = ({ background, foreground, onChange }: ThemeColorsSectionProps) => {
  const lastSolidBackground = useRef('#ffffff');
  const isTransparent = background === 'transparent';

  const handleTransparentChange = (checked: boolean) => {
    if (checked) {
      if (background && background !== 'transparent') {
        lastSolidBackground.current = background;
      }
      onChange({ background: 'transparent' });
      return;
    }
    onChange({ background: lastSolidBackground.current });
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">
        <Translate>Chart theme</Translate>
      </h3>
      <Checkbox
        name="transparent-background"
        label="Transparent background"
        checked={isTransparent}
        onChange={e => handleTransparentChange((e.target as HTMLInputElement).checked)}
      />
      <InputColorPicker
        id="bg-color"
        name="background-color"
        value={isTransparent ? lastSolidBackground.current : background || '#ffffff'}
        label="Background"
        disabled={isTransparent}
        onChange={color => {
          lastSolidBackground.current = color;
          onChange({ background: color });
        }}
      />
      <InputColorPicker
        id="fg-color"
        name="foreground-color"
        value={foreground || '#1a1a1a'}
        label="Foreground"
        onChange={color => onChange({ foreground: color })}
      />
    </section>
  );
};

export { ThemeColorsSection };
