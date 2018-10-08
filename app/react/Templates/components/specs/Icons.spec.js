import Icons from '../Icons';

describe('Icons', () => {
  it('should hold the option icons map', () => {
    expect(Icons).toMatchSnapshot();
  });
});
