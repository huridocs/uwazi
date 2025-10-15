import { Context, Property } from 'api/core/domain/template/Property';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { NestedPropertyNotAvailableError } from 'api/core/domain/template/errors';
import { NestedPropertyProps, NestedProperty } from 'api/core/domain/template/NestedProperty';
import { AbstractPropertyCreatorService } from './AbstractPropertyCreatorService';

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
