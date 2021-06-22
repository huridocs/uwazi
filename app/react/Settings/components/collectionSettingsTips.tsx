import React from 'react';

export const landingPageTip = (
  <>
    Configure the default landing page for your site.
    <hr />
    Examples:
    <br />
    -Site page: <i>/page/dicxg0oagy3xgr7ixef80k9</i>
    <br />
    -Library with custom results:
    <br />
    <i>
      /library/?searchTerm=testAn entity: /entity/9htbkgpkyy7j5rk9A document:
      /document/4y9i99fadjp833di
    </i>
    <br />
    <br />
    Always use URLs relative to your site, starting with / and skipping the domain name. Example:
    https://yoursite.com/
  </>
);

export const customFavIcon = (
  <>
    Favicon is an icon that appears in the browser tab and bookmarks.
    <br />
    <br />
    You will need to reload the page after updating your Favicon.
  </>
);

export const publicSharing = (
  <>Check to make this instance private (only logged-in users can access the data)</>
);

export const cookiePolicy = (
  <>This option will show a notification about the use of cookies in your instance.</>
);

export const emails = [
  <>
    Here you can set up the contact email and the email that appears when Uwazi sends a notification
    to a user
  </>,
  <>
    If you have added a contact form on one of your pages, this is the email address that receives
    the information from that form.
  </>,
  <>
    You can configure the email that will appear as the sender when any email is sent to the user.
    If this email is not set, “no-reply@uwazi.io” will be used instead.
  </>,
];

export const characterSupport = (
  <>
    Toggling this button enhances support for non-latin languages as default languages. This will
    update all template properties automatically. <br />
    <b>
      This process could take several minutes and will likely change URLs to library filters. If you
      have menus or links using such URLs, they will probably stop working after the update. You
      will need to update them manually.
    </b>
    <br />
    After selecting this option, you will not be able to revert back to using legacy property
    naming. If you are not facing issues with your template property names, we recommend leaving
    this unchecked.
  </>
);

export const analytics = (
  <>
    If you want to track analytics related to your collection visits, Uwazi supports both Google
    Analytics and Matomo.
  </>
);

export const mapAxis = <>Set the default starting point for your geolocation properties.</>;

export const publicForm = [
  <>Here you can configure the public form destination and the whitelisted templates</>,
  <>You can configure the URL of a different Uwazi to receive the submits from your Public Form</>,
  <>
    If you wish to include a public form on your page, you must white-list the template by selecting
    it from the list.
  </>,
];

export const mapTiler = <>We provide a default key, you can set your own MapTiler API key</>;
