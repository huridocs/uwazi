import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js'; // Todo
import { Context, Property } from '../../domain/template/Property.js';
import { NestedPropertyNotAvailableError } from '../../domain/template/errors.js';
import { NestedPropertyProps, NestedProperty } from '../../domain/template/NestedProperty.js';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService.js';

type Deps = {
  settingsDS: SettingsDataSource;
};

type Props = NestedPropertyProps;

class NestedPropertyCreatorService extends AbstractPropertyCreatorService<Deps> {
  protected async createProperty(props: Props, context: Context): Promise<Property> {
    const settings = await this.deps.settingsDS.get();

    if (settings.project !== 'cejil') {
      throw new NestedPropertyNotAvailableError(props);
    }

    const property = new NestedProperty(props, context);

    return property;
  }
}

export { NestedPropertyCreatorService };
