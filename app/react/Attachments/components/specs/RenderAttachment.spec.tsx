import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { AttachmentSchema } from 'shared/types/commonTypes';
import MarkdownMedia, { MarkdownMediaProps } from 'app/Markdown/components/MarkdownMedia';
import ReactPlayer from 'react-player';
import { RenderAttachment } from '../RenderAttachment';

describe('RenderAttachment', () => {
  let component: ShallowWrapper<typeof RenderAttachment>;
  let attachment: AttachmentSchema;

  describe('unsuported scenarios', () => {
    describe('no mimetype', () => {
      beforeEach(() => {
        attachment = {
          url: 'http://somewhere.org',
          originalname: 'A Sad Cat',
        };

        component = shallow(<RenderAttachment attachment={attachment} />);
      });

      it('should return null', () => {
        expect(component.type()).toEqual(null);
      });
    });

    describe('unsuported mimetype', () => {
      beforeEach(() => {
        attachment = {
          filename: 'c4ts.pdf',
          mimetype: 'application/pdf',
          originalname: 'A Sad Cat',
        };

        component = shallow(<RenderAttachment attachment={attachment} />);
      });

      it('should return null', () => {
        expect(component.type()).toEqual(null);
      });
    });
  });

  describe('image', () => {
    describe('from url', () => {
      beforeEach(() => {
        attachment = {
          url: 'http://awesomecats.org/ahappycat',
          mimetype: 'image/png',
          originalname: 'A Happy Cat',
        };

        component = shallow(<RenderAttachment attachment={attachment} />);
      });

      it('should render a tag image with the url of the image', () => {
        const img = component.find('img');
        expect(img.props().src).toBe(attachment.url);
        expect(img.props().alt).toBe(attachment.originalname);
      });
    });

    describe('from file', () => {
      beforeEach(() => {
        attachment = {
          filename: '4h4ppyc47.png',
          mimetype: 'image/png',
          originalname: 'A Happy Cat',
        };

        component = shallow(<RenderAttachment attachment={attachment} />);
      });

      it('should render a tag image with the url of the image', () => {
        const img = component.find('img');
        expect(img.props().src).toBe('/api/files/4h4ppyc47.png');
        expect(img.props().alt).toBe(attachment.originalname);
      });
    });
  });

  describe('video / audio', () => {
    describe('from url', () => {
      beforeEach(() => {
        attachment = {
          url: 'http://awesomecats.org/ahappycat.mp4',
          mimetype: 'video/mp4',
          originalname: 'A Happy Cat',
        };

        component = shallow(<RenderAttachment attachment={attachment} />);
      });

      it('should render a MarkdownMedia component', () => {
        const video: ShallowWrapper<
          MarkdownMediaProps,
          never,
          React.Component<{}, {}, any>
        > = component.find(MarkdownMedia);
        expect(video.props()).toEqual({
          config: '(http://awesomecats.org/ahappycat.mp4)',
        });
      });
    });

    describe('from file', () => {
      beforeEach(() => {
        attachment = {
          filename: '4h4ppyc47.mp4',
          mimetype: 'audio/mp4',
          originalname: 'A Happy Cat',
        };

        component = shallow(<RenderAttachment attachment={attachment} />);
      });

      it('should render a tag image with the url of the image', () => {
        const video: ShallowWrapper<
          MarkdownMediaProps,
          never,
          React.Component<{}, {}, any>
        > = component.find(MarkdownMedia);
        expect(video.props()).toEqual({ config: '(/api/files/4h4ppyc47.mp4)' });
      });
    });

    describe('from known media sites', () => {
      beforeEach(() => {
        attachment = {
          url: 'http://reacplayer.valid.url?w=happycat',
          mimetype: 'application/html',
          originalname: 'A Happy Cat',
        };

        jest.spyOn(ReactPlayer, 'canPlay').mockReturnValue(true);
        component = shallow(<RenderAttachment attachment={attachment} />);
      });

      it('should render a tag image with the url of the image', () => {
        const video: ShallowWrapper<
          MarkdownMediaProps,
          never,
          React.Component<{}, {}, any>
        > = component.find(MarkdownMedia);
        console.log(video.props());
        expect(video.props()).toEqual({
          config: '(http://reacplayer.valid.url?w=happycat)',
        });
      });
    });
  });
});
