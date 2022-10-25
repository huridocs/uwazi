import { createPartialMock } from '../createPartialMock';

interface ToBeMocked {
  one: Function;
  two: number;
  three: string;
}

const mockedFunction = () => {};
const mock = createPartialMock<ToBeMocked>({
  one: mockedFunction,
  two: 2,
});

describe('when accessing a defined member', () => {
  it('should return it', () => {
    expect(mock.one).toBe(mockedFunction);
    expect(mock.two).toBe(2);
  });
});

describe('when accessing a non-defined member', () => {
  it('should throw', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _three = mock.three;
    }).toThrowError(/three/);
  });
});
