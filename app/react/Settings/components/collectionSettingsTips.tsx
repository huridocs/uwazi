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
  <>
    Allow administrators and editors to share entities publicly. Visitors to your Uwazi will be able
    to see this entities without logging in.
  </>
);

export const cookiePolicy = (
  <>This option will show a notification about the use of cookies in your instance.</>
);

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

export const publicForm = <>Placeholder text.</>;
