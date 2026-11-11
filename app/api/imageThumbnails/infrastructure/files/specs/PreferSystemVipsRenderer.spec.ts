import { FileContents } from '#api/core/domain/files/FileContents.js';
import { PreferSystemVipsRenderer } from '../PreferSystemVipsRenderer.js';

const contents = () =>
  new FileContents(async function* empty() {
    yield new Uint8Array();
  });

const renderer = (label: string) => ({
  label,
  render: jest.fn(async () => contents()),
});

describe('PreferSystemVipsRenderer', () => {
  it('uses system vips when the installed version is 8.18.7 or newer', async () => {
    const system = renderer('system');
    const basic = renderer('basic');
    const preferred = new PreferSystemVipsRenderer(async () => '8.18.7', system, basic);

    await preferred.render(contents());

    expect(system.render).toHaveBeenCalledTimes(1);
    expect(basic.render).not.toHaveBeenCalled();
  });

  it('uses sharp when vips is missing or older than 8.18.7', async () => {
    const system = renderer('system');
    const basic = renderer('basic');
    const missing = new PreferSystemVipsRenderer(async () => undefined, system, basic);
    const old = new PreferSystemVipsRenderer(async () => '8.12.1', system, basic);

    await missing.render(contents());
    await old.render(contents());

    expect(system.render).not.toHaveBeenCalled();
    expect(basic.render).toHaveBeenCalledTimes(2);
  });
});
