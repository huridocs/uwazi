import React, { useEffect, useState } from 'react';
import { Dispatch, bindActionCreators } from 'redux';
import { connect, ConnectedProps } from 'react-redux';

import { IStore } from 'app/istore';
import { Tip } from 'app/Layout';
import { ToggleChildren } from 'app/Settings/components/ToggleChildren';
import { t } from 'app/I18N';
import { loadPages as loadPagesAction } from 'app/Pages/actions/pageActions';

const mapStateToProps = ({ pages }: IStore, ownProps: { selectedPage: string }) => ({
  pages: pages?.filter(p => p.get('entityView')) || [],
  selectedPage: ownProps.selectedPage,
});

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ loadPages: loadPagesAction }, dispatch);

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const ViewTemplateAsPage = ({ pages, loadPages, selectedPage }: mappedProps) => {
  const [selected, setSelected] = useState(selectedPage);
  useEffect(() => {
    loadPages();
  }, []);

  return (
    <div>
      <label>
        {pages.size > 0
          ? t('System', 'Display entity view from page')
          : t('System', 'There are no pages enabled for entity view')}
        <Tip icon="info-circle" position="right">
          {t(
            'System',
            'Entities can be displayed in a custom page. For that, a custom page needs to be created in Pages, and then selected here.'
          )}
        </Tip>
      </label>
      {pages.size > 0 && (
        <ToggleChildren toggled={Boolean(selectedPage)}>
          <select
            value={selected}
            onChange={e => {
              setSelected(e.target.value);
            }}
          >
            {pages.map(page => (
              <option value={page?.get('_id')?.toString()} key={page?.get('_id')?.toString()}>
                {page?.get('title')}
              </option>
            ))}
          </select>
        </ToggleChildren>
      )}
    </div>
  );
};

const container = connector(ViewTemplateAsPage);
export { container as ViewTemplateAsPage };
