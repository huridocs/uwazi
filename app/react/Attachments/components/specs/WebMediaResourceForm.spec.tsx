import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { WebMediaResourceForm } from '../WebMediaResourceForm';

let component: ShallowWrapper;

const submitSpy = jest.fn();

const render = (name: boolean) => {
  component = shallow(<WebMediaResourceForm handleSubmit={submitSpy} hasName={name} />);
};

it('Should match render of wem media form', () => {
  render(false);
  expect(component).toMatchSnapshot();
});

it('should also display a name field when hasName is true', () => {
  render(true);
  expect(component).toMatchSnapshot();
});

it('should call the handleSubmit function on submit', () => {
  render(true);
  component.find('LocalForm').simulate('submit', { url: 'https://example.com' });
  expect(submitSpy).toHaveBeenCalled();
});

describe('URL validation', () => {
  beforeEach(() => {
    submitSpy.mockClear();
  });

  it('should submit valid URLs', () => {
    render(false);
    const validUrl = 'https://example.com/image.jpg';
    component.find('LocalForm').simulate('submit', { url: validUrl });
    expect(submitSpy).toHaveBeenCalledWith({ url: validUrl });
  });

  it('should reject URLs that are too short', () => {
    render(false);
    const shortUrl = 'https://a';
    component.find('LocalForm').simulate('submit', { url: shortUrl });
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('should reject URLs that are too long', () => {
    render(false);
    const longUrl = 'https://example.com/' + 'a'.repeat(3000);
    component.find('LocalForm').simulate('submit', { url: longUrl });
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('should reject invalid URL formats', () => {
    render(false);
    const invalidUrl = 'not-a-url';
    component.find('LocalForm').simulate('submit', { url: invalidUrl });
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('should reject non-HTTP/HTTPS URLs', () => {
    render(false);
    const ftpUrl = 'ftp://example.com/file.jpg';
    component.find('LocalForm').simulate('submit', { url: ftpUrl });
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('should sanitize URLs before submission', () => {
    render(false);
    const maliciousUrl = 'https://example.com<script>alert("xss")</script>';
    component.find('LocalForm').simulate('submit', { url: maliciousUrl });
    expect(submitSpy).toHaveBeenCalledWith({ url: 'https://example.com' });
  });

  it('should handle empty URLs', () => {
    render(false);
    component.find('LocalForm').simulate('submit', { url: '' });
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('should handle undefined URLs', () => {
    render(false);
    component.find('LocalForm').simulate('submit', {});
    expect(submitSpy).not.toHaveBeenCalled();
  });
});
