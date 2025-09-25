import { Context, Property } from 'api/templates.v2/model/Property';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService';
import { NestedProperty, NestedPropertyProps } from '../NestedProperty';
import { NestedPropertyNotAvailableError } from '../errors';

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
