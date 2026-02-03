import { SettingsDataSource } from '../contracts/SettingsDataSource.js';
import { Context, Property } from '#api/core/domain/template/Property.js';
import { NestedPropertyNotAvailableError } from '#api/core/domain/template/errors.js';
import { NestedProperty, NestedPropertyProps } from '#api/core/domain/template/NestedProperty.js';
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
