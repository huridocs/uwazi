import Immutable from 'immutable';
import { manageAttachmentsReducer } from '../manageAttachmentsReducer';

describe('manageAttachmentsReducer', () => {
  let originalReducer;

  beforeEach(() => {
    originalReducer = (state, action) => `${JSON.stringify(state)}, ${JSON.stringify(action)}`;
  });

  it('should return defaults if no state and action passed', () => {
    expect(manageAttachmentsReducer(originalReducer)()).toBe('{}, {}');
  });

  it('should return the original reducer if no action match (extend the original reducer)', () => {
    const byPass = manageAttachmentsReducer(originalReducer)(
      { state: 'originalState' },
      { type: 'unmatched' }
    );
    expect(byPass).toBe('{"state":"originalState"}, {"type":"unmatched"}');
  });

  it('should not assign defaults if passed option as false', () => {
    expect(manageAttachmentsReducer(originalReducer, { useDefaults: false })()).toBe(
      'undefined, {}'
    );
  });

  describe('When state._id matches action.entity', () => {
    let action;
    let state;

    beforeEach(() => {
      action = { entity: 'eId' };
      state = Immutable.fromJS({ sharedId: 'eId' });
    });

    describe('When ATTACHMENT_COMPLETE', () => {
      it('should append the action file to attachments', () => {
        action.type = 'ATTACHMENT_COMPLETE';
        action.file = { file: 'file' };
        const attachments = manageAttachmentsReducer()(state, action).get('attachments').toJS();

        expect(attachments.length).toBe(1);
        expect(attachments[0]).toEqual(action.file);
      });
    });

    describe('When ATTACHMENT_DELETED', () => {
      it('should remove the action file from attachments', () => {
        action.type = 'ATTACHMENT_DELETED';
        action.file = { filename: 'file to be deleted', _id: 'id1' };
        state = state.set(
          'attachments',
          Immutable.fromJS([
            { filename: 'file to be deleted', _id: 'id1' },
            { filename: 'file to remain', _id: 'id2' },
          ])
        );

        const attachments = manageAttachmentsReducer()(state, action).get('attachments').toJS();

        expect(attachments.length).toBe(1);
        expect(attachments[0]).toEqual({ filename: 'file to remain', _id: 'id2' });
      });
    });

    describe('When ATTACHMENT_RENAMED', () => {
      it('should rename the document file originalname', () => {
        action.type = 'ATTACHMENT_RENAMED';
        action.file = { sharedId: 'eId', originalname: 'new name' };
        state = state.set('file', Immutable.fromJS({ originalname: 'original name' }));

        const file = manageAttachmentsReducer()(state, action).get('file').toJS();

        expect(file.originalname).toBe('new name');
      });

      it('should rename the selected attachment title', () => {
        action.type = 'ATTACHMENT_RENAMED';
        action.file = { _id: 2, originalname: 'new name' };
        state = state.set(
          'attachments',
          Immutable.fromJS([
            { _id: 1, originalname: 'file to remain' },
            { _id: 2, originalname: 'file to be edited' },
          ])
        );

        const attachments = manageAttachmentsReducer()(state, action).get('attachments').toJS();

        expect(attachments.length).toBe(2);
        expect(attachments[0].originalname).toBe('file to remain');
        expect(attachments[1].originalname).toBe('new name');
      });
    });
  });

  describe('When setIn is defined and _id matches action.entity', () => {
    let action;
    let state;

    beforeEach(() => {
      action = { entity: 'eId' };
      state = Immutable.fromJS({ selectedDocuments: [{ sharedId: 'eId' }] });
    });

    describe('When ATTACHMENT_COMPLETE', () => {
      it('should append the action file to attachments', () => {
        action.type = 'ATTACHMENT_COMPLETE';
        action.file = { file: 'file' };
        const attachments = manageAttachmentsReducer(unchagedState => unchagedState, {
          setInArray: ['selectedDocuments', 0],
        })(state, action)
          .getIn(['selectedDocuments', 0, 'attachments'])
          .toJS();

        expect(attachments.length).toBe(1);
        expect(attachments[0]).toEqual(action.file);
      });
    });

    describe('When ATTACHMENT_DELETED', () => {
      it('should remove the action file from attachments', () => {
        action.type = 'ATTACHMENT_DELETED';
        action.file = { filename: 'file to be deleted', _id: 'id1' };
        state = state.setIn(
          ['selectedDocuments', 0, 'attachments'],
          Immutable.fromJS([
            { filename: 'file to be deleted', _id: 'id1' },
            { filename: 'file to remain', _id: 'id2' },
          ])
        );

        const attachments = manageAttachmentsReducer(unchagedState => unchagedState, {
          setInArray: ['selectedDocuments', 0],
        })(state, action)
          .getIn(['selectedDocuments', 0, 'attachments'])
          .toJS();

        expect(attachments.length).toBe(1);
        expect(attachments[0]).toEqual({ filename: 'file to remain', _id: 'id2' });
      });
    });

    describe('When ATTACHMENT_RENAMED', () => {
      it('should rename the document file originalname', () => {
        action.type = 'ATTACHMENT_RENAMED';
        action.file = { sharedId: 'eId', originalname: 'new name' };
        state = state.setIn(
          ['selectedDocuments', 0, 'file'],
          Immutable.fromJS({ originalname: 'original name' })
        );

        const file = manageAttachmentsReducer(unchagedState => unchagedState, {
          setInArray: ['selectedDocuments', 0],
        })(state, action)
          .getIn(['selectedDocuments', 0, 'file'])
          .toJS();

        expect(file.originalname).toBe('new name');
      });

      it('should rename the selected attachment title', () => {
        action.type = 'ATTACHMENT_RENAMED';
        action.file = { _id: 2, originalname: 'new name' };
        state = state.setIn(
          ['selectedDocuments', 0, 'attachments'],
          Immutable.fromJS([
            { _id: 1, originalname: 'file to remain' },
            { _id: 2, originalname: 'file to be edited' },
          ])
        );

        const attachments = manageAttachmentsReducer(unchagedState => unchagedState, {
          setInArray: ['selectedDocuments', 0],
        })(state, action)
          .getIn(['selectedDocuments', 0, 'attachments'])
          .toJS();

        expect(attachments.length).toBe(2);
        expect(attachments[0].originalname).toBe('file to remain');
        expect(attachments[1].originalname).toBe('new name');
      });
    });
  });
});
