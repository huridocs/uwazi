import { renderConnected } from '#app/utils/test/renderConnected.js';
import { enzymeProps } from '#app/utils/enzymeNode.js';
import Immutable from 'immutable';
import { ShallowWrapper } from 'enzyme';
import {
  GroupedGeolocationViewer,
  GroupedGeolocationViewerProps,
} from '../GroupedGeolocationViewer.js';

describe('GroupedGeolocationViewer', () => {
  let state: any;
  let props: Partial<GroupedGeolocationViewerProps>;
  let component: ShallowWrapper;

  beforeEach(() => {
    props = {
      members: [
        {
          translateContext: 'oneTemplate',
          name: 'geolocation_label',
          label: 'Geolocation Label',
          value: [{ lat: '13', lon: '7' }],
        },
        {
          translateContext: 'otherTemplate',
          name: 'inherited_geolocation',
          label: 'Inherited Geolocation',
          value: [
            { lat: '15', lon: '9', label: 'One' },
            { lat: '17', lon: '11', label: 'Two' },
          ],
        },
      ],
    };

    state = {
      templates: Immutable.fromJS([
        {
          _id: 'oneTemplate',
          color: 'red',
        },
        {
          _id: 'otherTemplate',
          color: 'blue',
        },
      ]),
    };

    component = renderConnected(GroupedGeolocationViewer, props, state);
  });

  it("should render the marker groups with it's templates colors", () => {
    expect(component.find('GeolocationViewer').props().points).toEqual(
      expect.arrayContaining([
        { lat: '13', lon: '7', label: 'Geolocation Label', color: 'red' },
        { lat: '15', lon: '9', label: 'One', color: 'blue' },
        { lat: '17', lon: '11', label: 'Two', color: 'blue' },
      ])
    );
    expect(component.find('GeolocationViewer').props().points?.length).toBe(3);

    const pills = component.find('Pill');
    expect(enzymeProps(pills.get(0)).color).toBe('red');
    expect(enzymeProps(enzymeProps(pills.get(0)).children).children).toBe('Geolocation Label');
    expect(enzymeProps(pills.get(1)).color).toBe('blue');
    expect(enzymeProps(enzymeProps(pills.get(1)).children).children).toBe('One');
    expect(enzymeProps(pills.get(2)).color).toBe('blue');
    expect(enzymeProps(enzymeProps(pills.get(2)).children).children).toBe('Two');
    expect(pills.length).toBe(3);
  });
});
