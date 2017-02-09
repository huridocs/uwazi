const template = 'a9a88a38dbd9fedc9d5051741a14a1d0';
const thesauri = 'c08ef2532f0bd008ac5174b45e033c99';
const entityTemplate = 'c08ef2532f0bd008ac5174b45e033c98';

export default {
  "docs":[
    {"_id":"c08ef2532f0bd008ac5174b45e033c00","type":"reference", "title":"reference1", "sourceDocument": "source1", "targetDocument": "source2", language: 'es', "targetRange": {for: "range1", text: ''}, "sourceRange": {text: 'sourceRange'}, "relationType": 'relation1'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c01","type":"reference", "title":"reference2", "sourceDocument": "source2", "targetDocument": "doc3", language: 'en', "sourceRange": {for: "range2", text: 'range2'}, "targetRange": {text: 'targetRange'}, "relationType": 'relation2'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c03","type":"reference", "title":"reference3", "sourceDocument": "source2", "targetDocument": "doc4", language: 'es', "sourceRange": {for: "range3", text: 'range3'}, "relationType": 'relation2'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c07","type":"reference", "title":"reference4", "sourceDocument": "doc5", "targetDocument": "source2", "targetRange": "range1", "relationType": 'relation1'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c04","type":"reference", "title":"targetDocument", "targetDocument": "target"},
    {"_id":"c08ef2532f0bd008ac5174b45e033c05","type":"reference", "title":"targetDocument", "targetDocument": "target"},
    {"_id":"c08ef2532f0bd008ac5174b45e033c06","type":"reference", "title":"targetDocument1", "targetDocument": "target1"},
    {"_id":"c08ef2532f0bd008ac5174b45e033c08","type":"reference", "title":"reference5", "sourceDocument": "source2", "targetDocument": "doc4", language: 'es', "sourceRange": {for: "range3", text: 'range3'}, "relationType": 'relation2'},
    {"_id":"source1Id", "sharedId": "source1", "language": "es", title: "source1 title", type: "document", template: "template3_id", icon: 'icon1', metadata: {data: 'data1'}, creationDate: 123},
    {"_id":"doc3Id", "sharedId": "doc3", "language": "es", title: "doc3 title", type: "entity", template: "template1_id", published: true, icon: 'icon3', metadata: {data: 'data2'}, creationDate: 456},
    {"_id":"doc4Id", "sharedId": "doc4", "language": "es", title: "doc4 title", type: "document", template: "template1_id", metadata: {data: 'data3'}, creationDate: 789},
    {"_id":"doc5Id", "sharedId": "doc5", "language": "es", title: "doc5 title", type: "document", template: "template2_id"},

    //document-based existing reference
    {"_id":"c08ef2532f0bd008ac5174b45e033c10", "type":"reference", "title":"reference1", "sourceDocument": "entity_id", "targetDocument": "value2ID", "targetRange": "range1", "sourceRange": {text: 'sourceRange'}, "relationType": 'relation1'},
    {"_id":"c08ef2532f0bd008ac5174b45e033caa", "type":"reference", "title":"reference5", "sourceDocument": "doc3", "targetDocument": "source2", "targetRange": "range1", "sourceRange": {text: 'sourceRange'}, "relationType": 'relation1'},
    //inbound existing reference
    {"_id":"inbound", "type":"reference", "title":"indound_reference_1", "sourceDocument": "value2ID", "targetDocument": "entity_id", sourceType: "metadata", sourceProperty: "selectName"},
    //outbound existing reference
    {"_id":"outbound", "type":"reference", "title":"outbount_reference_1", "sourceDocument": "source2", "targetDocument": "doc3", sourceType: "metadata", sourceProperty: "selectName"},
    {"_id":"outbound2", "type":"reference", "title":"outbount_reference_2", "sourceDocument": "doc3", "targetDocument": "source2", sourceType: "metadata", sourceProperty: "selectName"},
    //selectValues
    {"_id":"selectValue", "sharedId": "selectValueID", "language": "es", title: "selectValue", type: "entity"},
    {"_id":"value1", "sharedId": "value1ID", "language": "es", title: "value1", type: "entity"},
    {"_id":"value2", "sharedId": "value2ID", "language": "es", title: "value2", type: "entity", template},
    //entitytemplate
    {"_id":entityTemplate, "type":"template"},
    {_id: 'template1_id', name: 'template 1', type: 'template', properties: [{
      name: 'selectName',
      type: 'select',
      label: 'Select Name',
      content: entityTemplate
    }]},
    {_id: 'template2_id', name: 'template 2', type: 'template'},
    {_id: 'template3_id', name: 'template 3', type: 'template'},
    //dictionary
    {"_id":thesauri, "type":"thesauri"},
    //relationTypes
    {_id:"relation1", name:"relation 1", type: "relationtype"},
    {_id:"relation2", name:"relation 2", type: "relationtype"},
    //conversion
    //templates
    {"_id": template, "type": "template", "properties": [
      {
        name: 'selectName',
        type: 'select',
        content: entityTemplate
      },
      {
        name: 'multiSelectName',
        type: 'multiselect',
        content: entityTemplate
      },
      {
        name: 'dictionarySelect',
        type: 'select',
        content: thesauri
      },
      {
        name: 'dictionaryMultiSelect',
        type: 'multiselect',
        content: thesauri
      },
      {
        name: 'otherName',
        type: 'other'
      }
    ]}
  ]
};

export {template};
