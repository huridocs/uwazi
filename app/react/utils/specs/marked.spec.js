import marked from '../marked';

describe('marked (extended Marked util)', () => {
  it('should work as a "by-pass" to the main marked function', () => {
    expect(marked('#Header\n\nText')).toBe('<p>#Header</p>\n<p>Text</p>\n');
  });

  describe('YouTube markup', () => {
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
      expect(marked(markup)).toContain('<br /><strong><i>YouTube markup error:');
      expect(marked(markup)).toContain('<div class="video-container"><iframe src="https://www.youtube.com/embed/qzzM4PT2Av8');
    });
  });
});
