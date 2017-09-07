import marked from '../marked';

describe('marked (extended Marked util)', () => {
  it('should work as a "by-pass" to the main marked function', () => {
    expect(marked('#Header\n\nText')).toBe('<p>#Header</p>\n<p>Text</p>\n');
  });

  fdescribe('YouTube markup', () => {
    it('should append a youtube iframe inside a video container div', () => {
      const markup = 'First paragraph\n\n{youtube}(https://www.youtube.com/watch?v=Pd4K2CtaVBo)\n\n' +
                     'Second paragraph\n\n{youtube}(https://youtu.be/qzzM4PT2Av8)';
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://www.youtube.com/embed/Pd4K2CtaVBo');
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://www.youtube.com/embed/qzzM4PT2Av8');
    });

    it('should append an error if video embeded in middle of a paragraph', () => {
      const markup = 'First paragraph {youtube}(https://www.youtube.com/watch?v=Pd4K2CtaVBo)\n\n' +
                     'Second paragraph\n\n{youtube}(https://youtu.be/qzzM4PT2Av8)';
      expect(marked(markup)).not.toContain('<div class="video-container"><iframe src="https://www.youtube.com/embed/Pd4K2CtaVBo');
      expect(marked(markup)).toContain('<br /><strong><i>youtube markup error:');
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://www.youtube.com/embed/qzzM4PT2Av8');
    });
  });

  fdescribe('Vimeo markup', () => {
    it('should append a vimeo iframe inside a video container div', () => {
      const markup = 'First paragraph\n\n{vimeo}(http://vimeo.com/6701902)\n\n' +
                     'Second paragraph\n\n{youtube}(https://youtu.be/qzzM4PT2Av8)\n\n' +
                     '{vimeo}(http://player.vimeo.com/video/67019023)\n\n' +
                     'Third paragraph\n\n{vimeo}(http://player.vimeo.com/video/6775546?title=0&byline=0&portrait=0)\n\n' +
                     '{vimeo}(http://vimeo.com/channels/staffpicks/67019026)\n\n' +
                     '{vimeo}(https://vimeo.com/15414122)';

      /* <iframe src="https://player.vimeo.com/video/222826119" width="640" height="360" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe> */
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://player.vimeo.com/video/6701902');
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://www.youtube.com/embed/qzzM4PT2Av8');
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://player.vimeo.com/video/67019023');
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://player.vimeo.com/video/6775546');
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://player.vimeo.com/video/67019026');
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://player.vimeo.com/video/15414122');
    });

    it('should append an error if video embeded in middle of a paragraph', () => {
      const markup = 'First paragraph {vimeo}(http://vimeo.com/6701902)\n\n' +
                     'Second paragraph\n\n{youtube}(https://youtu.be/qzzM4PT2Av8)';
      expect(marked(markup)).not.toContain('<div class="video-container"><iframe src="https://player.vimeo.com/video/6701902');
      expect(marked(markup)).toContain('<br /><strong><i>vimeo markup error:');
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://www.youtube.com/embed/qzzM4PT2Av8');
    });
  });
});
