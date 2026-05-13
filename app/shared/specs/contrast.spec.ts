import { checkContrast, getTemplatePillColors } from '#shared/utils/contrast.js';

describe('getTemplatePillColors', () => {
  it('uses accent as foreground when a light tint meets AA', () => {
    const { background, foreground, ratio } = getTemplatePillColors('#2B56C1', '#F5F0E8');
    expect(foreground).toBe('#2B56C1');
    expect(checkContrast(background, foreground).passesAA).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('adjusts foreground when accent on tint cannot reach AA', () => {
    const { background, foreground, ratio } = getTemplatePillColors('#9eb0fd', '#F5F0E8');
    expect(foreground).not.toBe('#9eb0fd');
    expect(checkContrast(background, foreground).passesAA).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
