import React, { useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';

const getTextColor = (backgroundHex: string): string => {
  if (!backgroundHex) {
    return '#000';
  }

  let hexColor = backgroundHex.replace('#', '').trim();

  if (hexColor.length === 3) {
    hexColor = hexColor
      .split('')
      .map(x => x + x)
      .join('');
  }

  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  if (brightness > 128) {
    // For light backgrounds, return a darker, more saturated version of the color
    // Convert to HSL to maintain hue while darkening
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === rNorm) {
        h = ((gNorm - bNorm) / delta) % 6;
      } else if (max === gNorm) {
        h = (bNorm - rNorm) / delta + 2;
      } else {
        h = (rNorm - gNorm) / delta + 4;
      }
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Create darker version: reduce lightness significantly, increase saturation slightly
    const newL = Math.max(0.2, l * 0.3); // Much darker (30% of original lightness, min 20%)
    const newS = Math.min(1, s * 1.2); // Slightly more saturated (max 100%)

    // Convert back to RGB
    const c = (1 - Math.abs(2 * newL - 1)) * newS;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = newL - c / 2;

    let newR = 0;
    let newG = 0;
    let newB = 0;

    if (h < 60) {
      newR = c;
      newG = x;
      newB = 0;
    } else if (h < 120) {
      newR = x;
      newG = c;
      newB = 0;
    } else if (h < 180) {
      newR = 0;
      newG = c;
      newB = x;
    } else if (h < 240) {
      newR = 0;
      newG = x;
      newB = c;
    } else if (h < 300) {
      newR = x;
      newG = 0;
      newB = c;
    } else {
      newR = c;
      newG = 0;
      newB = x;
    }

    const darkR = Math.round((newR + m) * 255);
    const darkG = Math.round((newG + m) * 255);
    const darkB = Math.round((newB + m) * 255);

    return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
  }

  // For dark backgrounds, return white
  return '#FFF';
};

const TemplateLabel = ({
  label,
  templateId,
  color = '#A4CAFE',
}: {
  label: string;
  templateId?: string;
  color?: string;
}) => {
  const textColor = useMemo(() => getTextColor(color), [color]);

  if (!label) {
    return undefined;
  }

  return (
    <div
      className="text-xs font-medium px-2 py-1 rounded-sm w-fit"
      style={{ backgroundColor: color, color: textColor }}
    >
      <Translate context={templateId}>{label}</Translate>
    </div>
  );
};

export { TemplateLabel, getTextColor };
