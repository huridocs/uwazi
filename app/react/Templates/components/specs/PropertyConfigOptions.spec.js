import { renderConnected } from 'app/utils/test/renderConnected';
import PropertyConfigOptions from '../PropertyConfigOptions';

describe('PropertyConfigOptions', () => {
  let component;
  let props;
  let storeData;

  beforeEach(() => {
    props = {
      index: 2,
      type: 'select',
      property: {},
    };

    storeData = {
      template: {
        data: {
          properties: [
            { name: 'title', label: 'Title' },
            { name: 'creationDate' },
            { name: 'property2' },
          ],
        },
      },
    };
  });

  const expectMatch = () => {
    component = renderConnected(PropertyConfigOptions, props, storeData);
    expect(component).toMatchSnapshot();
  };

  it('should render fields with the correct datas', () => {
    expectMatch();
  });

  describe('Once the property is checked as filter', () => {
    it('should render the default filter option', () => {
      storeData.template.data.properties[2].filter = true;
      expectMatch();
    });
  });

  describe('priority sorting option', () => {
    describe('when property filter is true', () => {
      it('should render for text, date, numeric and select if property filter is true', () => {
        storeData.template.data.properties[2].filter = true;
        props.type = 'text';
        expectMatch();
        props.type = 'date';
        expectMatch();
        props.type = 'numeric';
        expectMatch();
        props.type = 'select';
        expectMatch();
      });
    });
    describe('when property filter is not true', () => {
      it('should not render priority sorting option', () => {
        storeData.template.data.properties[2].filter = false;
        props.type = 'text';
        expectMatch();
        props.type = 'date';
        expectMatch();
        props.type = 'numeric';
        expectMatch();
        props.type = 'select';
        expectMatch();
      });
    });
  });

  describe('Additional options', () => {
    it('should allow to exclude the "use as filter" option', () => {
      props.canBeFilter = false;
      expectMatch();
    });
  });
});
