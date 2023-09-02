/* eslint-disable max-lines */
/* eslint-disable max-statements */
import React, { useRef } from 'react';
import { Field } from 'react-redux-form';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import type { DragSourceMonitor } from 'react-dnd';
import { Icon } from 'UI';
import * as navlinksActions from 'app/Settings/actions/navlinksActions';
import { IStore } from 'app/istore';
import { Translate } from 'app/I18N';
import { ILink, ItemTypes } from 'app/V2/shared/types';
import { withDnD } from 'app/componentWrappers';
import { hoverSortable } from 'app/Layout/DragAndDrop';

const groupStyles = {
  paddingRight: '0px',
  display: 'flex',
};

const linkStyles = {
  display: 'flex',
};
interface NavlinkFormProps {
  index: number;
  link: ILink;
  removeLink: Function;
  useDrag: any;
  useDrop: any;
  sortLink: Function;
}

const mapStateToProps = ({ settings }: IStore) => {
  const { links = [] } = settings.navlinksData || {};
  return {
    formState: settings.navlinksFormState,
    links,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators(
    {
      removeLink: navlinksActions.removeLink,
      addGroupLink: navlinksActions.addGroupLink,
      removeGroupLink: navlinksActions.removeGroupLink,
    },
    dispatch
  );

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & NavlinkFormProps;

const NavlinkFormComponent: React.FC<mappedProps> = ({
  links,
  link,
  useDrag,
  useDrop,
  removeLink,
  addGroupLink,
  removeGroupLink,
  formState,
  index,
  sortLink,
}: mappedProps) => {
  const ref = useRef<HTMLLIElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.LINK,
    collect(monitor: any) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover: hoverSortable(ref, index, sortLink),
  });

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.LINK,
    item: () => ({ index }),
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  let itemClassName = `list-group-item${isDragging ? ' dragging' : ''}`;
  let titleClass = 'input-group';

  if (formState?.$form.errors[`links.${index}.title.required`]) {
    itemClassName += ' error';
    titleClass += ' has-error';
  }

  const items = [];

  const opacity = isDragging ? 0 : 1;

  drag(drop(ref));

  return (
    <li className={itemClassName} ref={ref} style={{ opacity }} data-handler-id={handlerId}>
      <div className="propery-form expand">
        <div>
          <div className="row">
            <div className="col-sm-12">
              <div className="row">
                <div
                  className={link.type === 'group' ? 'col-sm-11' : 'col-sm-3'}
                  style={link.type === 'group' ? groupStyles : linkStyles}
                >
                  <span className="property-name" style={{ paddingRight: '10px', width: '70px' }}>
                    <Icon icon="bars" className="reorder" />
                    &nbsp;
                    <Icon icon={link.type === 'group' ? 'caret-square-down' : 'link'} />
                  </span>
                  <div className={`${titleClass} input-Ngroup-width`}>
                    <span className="input-group-addon">
                      <Translate>Title</Translate>
                    </span>
                    <Field model={`settings.navlinksData.links[${index}].title`}>
                      <input className="form-control" style={{ width: 'calc(100% + 5px)' }} />
                    </Field>
                  </div>
                </div>
                {link.type !== 'group' && (
                  <div className="col-sm-8" style={{ paddingRight: '0px' }}>
                    <div className="input-group">
                      <span className="input-group-addon">
                        <Translate>URL</Translate>
                      </span>
                      <Field model={`settings.navlinksData.links[${index}].url`}>
                        <input className="form-control" style={{ width: 'calc(100% + 5px)' }} />
                      </Field>
                    </div>
                  </div>
                )}
                <div className="col-sm-1">
                  <button
                    type="button"
                    className="btn btn-danger btn-xs property-remove, menu-delete-button"
                    style={{ marginLeft: '4px' }}
                    onClick={() => removeLink(index)}
                  >
                    <Icon icon="trash-alt" /> <Translate>Delete</Translate>
                  </button>
                </div>
              </div>
              <div className="row">
                {link.type === 'group' && (
                  <div style={{ paddingLeft: '80px' }}>
                    <div className="row">
                      <div className="col-sm-12">
                        {links[index].sublinks?.map((sublink: ILink, i: number) => (
                          <div
                            className="row"
                            style={{ paddingBottom: '5px', paddingTop: '5px' }}
                            // eslint-disable-next-line react/no-array-index-key
                            key={`${sublink.title}_${i}`}
                          >
                            <div className="col-sm-3" style={{ display: 'flex' }}>
                              <span style={{ padding: '5px 10px 0px 0px' }}>
                                <Icon icon="link" />
                              </span>
                              <div className={`${titleClass} input-group-width`}>
                                <span className="input-group-addon">
                                  <Translate>Title</Translate>
                                </span>
                                <Field
                                  model={`settings.navlinksData.links[${index}].sublinks[${i}].title`}
                                >
                                  <input
                                    className="form-control"
                                    style={{ width: '100%' }}
                                    ref={f => items.push(f)}
                                  />
                                </Field>
                              </div>
                            </div>
                            <div className="col-sm-8">
                              <div className="input-group">
                                <span className="input-group-addon">
                                  <Translate>URL</Translate>
                                </span>
                                <Field
                                  model={`settings.navlinksData.links[${index}].sublinks[${i}].url`}
                                >
                                  <input className="form-control" />
                                </Field>
                              </div>
                            </div>
                            <div className="col-sm-1" style={{ paddingLeft: '0px' }}>
                              <button
                                type="button"
                                className="btn btn-danger btn-xs property-remove, menu-delete-button"
                                onClick={() => removeGroupLink(index, i)}
                              >
                                <Icon icon="trash-alt" /> <Translate>Delete</Translate>
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="row">
                          <div className="col-sm-12">
                            <button
                              className="menu-link-group-button"
                              type="button"
                              onClick={addGroupLink.bind(this, links, index)}
                            >
                              <Icon icon="link" />
                              &nbsp;<Translate>Add link</Translate>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

const container = connector(withDnD<mappedProps>(NavlinkFormComponent));
export { container as NavlinkForm };
