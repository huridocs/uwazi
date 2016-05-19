// import React from 'react';
// import {shallow} from 'enzyme';
//
// import {FilterSuggestions} from 'app/Templates/components/FilterSuggestions';
//
// describe('FilterSuggestions', () => {
//   let component;
//   let props;
//
//   function renderComponent(label = 'test', type = 'checkbox', content) {
//     props = {
//       label,
//       type,
//       filter: true,
//       content,
//       parentTemplateId: 'template1',
//       templates: [
//         {_id: 'template1', properties: [
//           {localID: 1, label: label, filter: true, type},
//           {localID: 2, label: 'something else'}
//         ]},
//         {_id: 'template2', name: 'Template 2', properties: [
//           {label: 'Date', type: 'date', filter: true},
//           {label: 'Author', type: 'text', filter: true},
//           {label: 'Authors', type: 'select', filter: true, content: 'abc1'}
//         ]},
//         {_id: 'template3', name: 'Template 3', properties: [
//           {label: 'Date', type: 'date', filter: true},
//           {label: 'Keywords', type: 'text', filter: true}
//         ]}
//       ],
//       thesauris: [
//         {_id: 'abc1', name: 'Best SCI FI Authors'},
//         {_id: 'abc2', name: 'Favourite dessert recipes'}
//       ]
//     };
//
//     component = shallow(<FilterSuggestions {...props}/>);
//   }
//
//   beforeEach(renderComponent);
//
//   describe('when matches type and label as other template property', () => {
//     it('should show a message', () => {
//       renderComponent('author', 'text');
//       expect(component.find('.filter-suggestions').text())
//       .toBe(' This property will be used as filter in addition to the same property in Template 2.');
//     });
//   });
//
//   describe('when matches to multiple templates', () => {
//     it('should show a message', () => {
//       renderComponent('Date', 'date');
//       expect(component.find('.filter-suggestions').text())
//       .toBe(' This property will be used as filter in addition to the same property in Template 2 and Template 3.');
//     });
//   });
//
//   describe('when matches to multiple templates', () => {
//     it('should show a message', () => {
//       renderComponent('Keywords', 'date');
//       expect(component.find('.filter-suggestions').text())
//       .toBe(' This property has the same label as other in Template 3, but not the same type (text) and won\'t be used together for filtering.');
//     });
//   });
// });
