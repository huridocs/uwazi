"use strict";var _immutable = _interopRequireDefault(require("immutable"));
var _manageAttachmentsReducer = _interopRequireDefault(require("../manageAttachmentsReducer"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('manageAttachmentsReducer', () => {
  let originalReducer;

  beforeEach(() => {
    originalReducer = (state, action) => `${JSON.stringify(state)}, ${JSON.stringify(action)}`;
  });

  it('should return defaults if no state and action passed', () => {
    expect((0, _manageAttachmentsReducer.default)(originalReducer)()).toBe('{}, {}');
  });

  it('should return the original reducer if no action match (extend the original reducer)', () => {
    const byPass = (0, _manageAttachmentsReducer.default)(originalReducer)({ state: 'originalState' }, { type: 'unmatched' });
    expect(byPass).toBe('{"state":"originalState"}, {"type":"unmatched"}');
  });

  it('should not assign defaults if passed option as false', () => {
    expect((0, _manageAttachmentsReducer.default)(originalReducer, { useDefaults: false })()).toBe('undefined, {}');
  });

  describe('When state._id matches action.entity', () => {
    let action;
    let state;

    beforeEach(() => {
      action = { entity: 'eId' };
      state = _immutable.default.fromJS({ _id: 'eId' });
    });

    describe('When ATTACHMENT_COMPLETE', () => {
      it('should append the action file to attachments', () => {
        action.type = 'ATTACHMENT_COMPLETE';
        action.file = { file: 'file' };
        const attachments = (0, _manageAttachmentsReducer.default)()(state, action).get('attachments').toJS();

        expect(attachments.length).toBe(1);
        expect(attachments[0]).toEqual(action.file);
      });
    });

    describe('When ATTACHMENT_DELETED', () => {
      it('should remove the action file from attachments', () => {
        action.type = 'ATTACHMENT_DELETED';
        action.file = { filename: 'file to be deleted' };
        state = state.set('attachments', _immutable.default.fromJS([{ filename: 'file to be deleted' }, { filename: 'file to remain' }]));

        const attachments = (0, _manageAttachmentsReducer.default)()(state, action).get('attachments').toJS();

        expect(attachments.length).toBe(1);
        expect(attachments[0]).toEqual({ filename: 'file to remain' });
      });
    });

    describe('When ATTACHMENT_RENAMED', () => {
      it('should rename the document file originalname', () => {
        action.type = 'ATTACHMENT_RENAMED';
        action.file = { _id: 'eId', originalname: 'new name' };
        state = state.set('file', _immutable.default.fromJS({ originalname: 'original name' }));

        const file = (0, _manageAttachmentsReducer.default)()(state, action).get('file').toJS();

        expect(file.originalname).toBe('new name');
      });

      it('should rename the selected attachment title', () => {
        action.type = 'ATTACHMENT_RENAMED';
        action.file = { _id: 2, originalname: 'new name' };
        state = state.set(
        'attachments',
        _immutable.default.fromJS([{ _id: 1, originalname: 'file to remain' }, { _id: 2, originalname: 'file to be edited' }]));


        const attachments = (0, _manageAttachmentsReducer.default)()(state, action).get('attachments').toJS();

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
      state = _immutable.default.fromJS({ selectedDocuments: [{ _id: 'eId' }] });
    });

    describe('When ATTACHMENT_COMPLETE', () => {
      it('should append the action file to attachments', () => {
        action.type = 'ATTACHMENT_COMPLETE';
        action.file = { file: 'file' };
        const attachments = (0, _manageAttachmentsReducer.default)(unchagedState => unchagedState, { setInArray: ['selectedDocuments', 0] })(state, action).
        getIn(['selectedDocuments', 0, 'attachments']).toJS();

        expect(attachments.length).toBe(1);
        expect(attachments[0]).toEqual(action.file);
      });
    });

    describe('When ATTACHMENT_DELETED', () => {
      it('should remove the action file from attachments', () => {
        action.type = 'ATTACHMENT_DELETED';
        action.file = { filename: 'file to be deleted' };
        state = state.setIn(['selectedDocuments', 0, 'attachments'],
        _immutable.default.fromJS([{ filename: 'file to be deleted' }, { filename: 'file to remain' }]));

        const attachments = (0, _manageAttachmentsReducer.default)(unchagedState => unchagedState, { setInArray: ['selectedDocuments', 0] })(state, action).
        getIn(['selectedDocuments', 0, 'attachments']).toJS();

        expect(attachments.length).toBe(1);
        expect(attachments[0]).toEqual({ filename: 'file to remain' });
      });
    });

    describe('When ATTACHMENT_RENAMED', () => {
      it('should rename the document file originalname', () => {
        action.type = 'ATTACHMENT_RENAMED';
        action.file = { _id: 'eId', originalname: 'new name' };
        state = state.setIn(['selectedDocuments', 0, 'file'], _immutable.default.fromJS({ originalname: 'original name' }));

        const file = (0, _manageAttachmentsReducer.default)(unchagedState => unchagedState, { setInArray: ['selectedDocuments', 0] })(state, action).
        getIn(['selectedDocuments', 0, 'file']).toJS();

        expect(file.originalname).toBe('new name');
      });

      it('should rename the selected attachment title', () => {
        action.type = 'ATTACHMENT_RENAMED';
        action.file = { _id: 2, originalname: 'new name' };
        state = state.setIn(['selectedDocuments', 0, 'attachments'],
        _immutable.default.fromJS([{ _id: 1, originalname: 'file to remain' }, { _id: 2, originalname: 'file to be edited' }]));

        const attachments = (0, _manageAttachmentsReducer.default)(unchagedState => unchagedState, { setInArray: ['selectedDocuments', 0] })(state, action).
        getIn(['selectedDocuments', 0, 'attachments']).toJS();

        expect(attachments.length).toBe(2);
        expect(attachments[0].originalname).toBe('file to remain');
        expect(attachments[1].originalname).toBe('new name');
      });
    });
  });
});