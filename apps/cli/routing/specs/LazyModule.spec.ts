import { LazyModule } from '../LazyModule.js';

describe('LazyModule', () => {
  it('should not import until first asked, then import only once', async () => {
    const load = jest.fn().mockResolvedValue({ value: 1 });
    const lazy = new LazyModule(load);

    expect(load).not.toHaveBeenCalled();
    expect(await lazy.get()).toEqual({ value: 1 });
    expect(await lazy.get()).toEqual({ value: 1 });
    expect(load).toHaveBeenCalledTimes(1);
  });
});
