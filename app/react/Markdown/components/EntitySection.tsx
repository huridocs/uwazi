/* eslint-disable react/no-multi-comp */
import { connect, ConnectedProps } from 'react-redux';
import sift from 'sift';
import { IStore } from 'app/istore';
import { UnwrapMetadataObject } from 'app/Metadata/actions/actions';
import { logError } from '../utils';
interface EntitySectionProps {
  'show-if'?: string;
  children: JSX.Element;
}

const mapStateToProps = ({ templates, entityView }: IStore) => ({
  entity: entityView.entity,
  templates,
});

const connector = connect(mapStateToProps);

type MappedProps = ConnectedProps<typeof connector>;
type ComponentProps = EntitySectionProps & MappedProps;

const EntitySection = ({ entity, templates, children, 'show-if': showIf }: ComponentProps) => {
  const jsEntity = entity.toJS();
  const template = templates.find(t => t?.get('_id') === jsEntity.template);
  const unwrappedMetadata = UnwrapMetadataObject(jsEntity.metadata, template.toJS());
  jsEntity.metadata = unwrappedMetadata;
  try {
    const condition = JSON.parse(showIf as string);
    const filtered = [jsEntity].filter(sift(condition));
    return filtered.length > 0 ? children : null;
  } catch (e) {
    logError(e, showIf);
    return null;
  }
};

const container = connector(EntitySection);
export { container as EntitySection };

/**
### EntitySection component
Sometimes you want to display a section of the entity based on whether a given condition is met.

Examples:   

You want to display the name of a person if they are older than 18 years old.
A simple implementation would look like this:
```html
<EntitySection show-if='{"metadata.age": { "$gt": 18 }}'>
  <EntityData label-of="name" /><EntityData value-of="name" />
</Entitysection>
```
you want to only show the name of a person if the name exists in the entity metadata
```html
<EntitySection show-if='{"metadata.name": { "$exists": true }}'>
  <EntityData label-of="name" /><EntityData value-of="name" />
</Entitysection>
```

You want to show the name of a person if it matches value `John` in the entity metadata
```html
<EntitySection show-if='{"metadata.name": { "$eq": "John" }}'>
  <EntityData label-of="name" /><EntityData value-of="name" />
</Entitysection>
<!-- or  -->
<EntitySection show-if='{"metadata.name": "John"}'>
  <EntityData label-of="name" /><EntityData value-of="name" />
</Entitysection>
```

Note: `show-if` value is a JSON string and the query should follow query string specified by [sift](https://github.com/crcn/sift.js)

The metadata is unwrapped into a JSON object with keys as the property names and values as the property values.
```js
metadata: {
  name: "John",
  age: 18
}

// Note that if the metadata property name has spaces, they are replaced with underscores and uppercase letters are converted to lowercase letters
// Eg: a metadata property name of "First Name" will be converted to "first_name" therefore:
metadata: {
  "first_name": "John",
  age: 18
}

```
*/
