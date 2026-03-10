import { renderConnected } from 'app/utils/test/renderConnected';
import Immutable from 'immutable';
import { ShallowWrapper } from 'enzyme';
import {
  GroupedGeolocationViewer,
  GroupedGeolocationViewerProps,
} from '../GroupedGeolocationViewer';

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
    expect(pills.get(0).props.color).toBe('red');
    expect(pills.get(0).props.children.props.children).toBe('Geolocation Label');
    expect(pills.get(1).props.color).toBe('blue');
    expect(pills.get(1).props.children.props.children).toBe('One');
    expect(pills.get(2).props.color).toBe('blue');
    expect(pills.get(2).props.children.props.children).toBe('Two');
    expect(pills.length).toBe(3);
  });
});
