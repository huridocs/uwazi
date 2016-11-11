const template = 'a9a88a38dbd9fedc9d5051741a14a1d0';
const thesauri = 'c08ef2532f0bd008ac5174b45e033c99';
const entityTemplate = 'c08ef2532f0bd008ac5174b45e033c98';

export default {
  "docs":[
    {"_id":"c08ef2532f0bd008ac5174b45e033c00","type":"reference", "title":"reference1", "sourceDocument": "source1", "targetDocument": "source2", "targetRange": "range1", "sourceRange": {text: 'sourceRange'}, "relationtype": 'relation1'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c01","type":"reference", "title":"reference2", "sourceDocument": "source2", "targetDocument": "doc3", "sourceRange": "range2", "targetRange": {text: 'targetRange'}, "relationtype": 'relation2'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c03","type":"reference", "title":"reference3", "sourceDocument": "source2", "targetDocument": "doc4", "sourceRange": "range3", "relationtype": 'relation2'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c07","type":"reference", "title":"reference4", "sourceDocument": "doc5", "targetDocument": "source2", "targetRange": "range1", "relationtype": 'relation1'},
    {"_id":"c08ef2532f0bd008ac5174b45e033c04","type":"reference", "title":"targetDocument", "targetDocument": "target"},
    {"_id":"c08ef2532f0bd008ac5174b45e033c05","type":"reference", "title":"targetDocument", "targetDocument": "target"},
    {"_id":"c08ef2532f0bd008ac5174b45e033c06","type":"reference", "title":"targetDocument1", "targetDocument": "target1"},
    {"_id":"source1Id", "sharedId": "source1", "language": "es", title: "source1 title", type: "document", template: "template3_id", icon: 'icon1', metadata: {data: 'data1'}, creationDate: 123},
    {"_id":"doc3Id", "sharedId": "doc3", "language": "es", title: "doc3 title", type: "entity", template: "template1_id", published: true, icon: 'icon3', metadata: {data: 'data2'}, creationDate: 456},
    {"_id":"doc4Id", "sharedId": "doc4", "language": "es", title: "doc4 title", type: "document", template: "template1_id", metadata: {data: 'data3'}, creationDate: 789},
    {"_id":"doc5Id", "sharedId": "doc5", "language": "es", title: "doc5 title", type: "document", template: "template2_id"},

    //document-based existing reference
    {"_id":"c08ef2532f0bd008ac5174b45e033c10", "type":"reference", "title":"reference1", "sourceDocument": "entity_id", "targetDocument": "value2ID", "targetRange": "range1", "sourceRange": {text: 'sourceRange'}, "relationtype": 'relation1'},
    //inbound existing reference
    {"_id":"inbound", "type":"reference", "title":"indound_reference_1", "sourceDocument": "value2ID", "targetDocument": "entity_id", sourceType: "metadata", sourceProperty: "selectName"},
    //selectValues
    {"_id":"selectValue", "sharedId": "selectValueID", "language": "es", title: "selectValue", type: "entity"},
    {"_id":"value1", "sharedId": "value1ID", "language": "es", title: "value1", type: "entity"},
    {"_id":"value2", "sharedId": "value2ID", "language": "es", title: "value2", type: "entity", template},
    //entitytemplate
    {"_id":entityTemplate, "type":"template"},
    //dictionary
    {"_id":thesauri, "type":"thesauri"},
    //conversion
    //templates
    {"_id": template, "type": "template", "properties": [{
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
    }]}
  ]
};

export {template};
