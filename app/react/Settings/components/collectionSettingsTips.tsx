import React from 'react';
import { Translate } from 'app/I18N';

export const landingPageTip = (
  <>
    <Translate>Configure the default landing page for your site.</Translate>
    <hr />
    <Translate>Examples</Translate>:
    <br />
    <Translate>- Site page:</Translate>
    <i no-translate>/page/dicxg0oagy3xgr7ixef80k9</i>
    <br />
    <Translate>- Library search:</Translate>
    <i no-translate>/library/?searchTerm=testAn </i>
    <br />
    <Translate>- Entity:</Translate>
    <i no-translate>/entity/9htbkgpkyy7j5rk9A</i>
    <br />
    <Translate>
      Always use URLs relative to your site, starting with / and skipping the domain name. Example:
    </Translate>
    <i>
      <Translate>https://yoursite.com/</Translate>
    </i>
  </>
);

export const customFavIcon = (
  <>
    <Translate>Favicon is an icon that appears in the browser tab and bookmarks.</Translate>
    <br />
    <br />
    <Translate>You will need to reload the page after updating your Favicon.</Translate>
  </>
);

export const publicSharing = (
  <Translate>
    Check to make this instance private (only logged-in users can access the data)
  </Translate>
);

export const cookiePolicy = (
  <>
    <Translate>
      This option will show a notification about the use of cookies in your instance.
    </Translate>
  </>
);

export const emails = [
  <Translate>
    Here you can set up the contact email and the email that appears when Uwazi sends a notification
    to a user
  </Translate>,
  <Translate>
    If you have added a contact form on one of your pages, this is the email address that receives
    the information from that form.
  </Translate>,
  <Translate>
    You can configure the email that will appear as the sender when any email is sent to the user.
    If this email is not set, “no-reply@uwazi.io” will be used instead.
  </Translate>,
];

export const characterSupport = (
  <>
    <Translate translationKey="Character support description">
      Toggling this button enhances support for non-latin languages as default languages. This will
      update all template properties automatically.
    </Translate>
    <br />
    <b>
      <Translate translationKey="Character support process warning">
        This process could take several minutes and will likely change URLs to library filters. If
        you have menus or links using such URLs, they will probably stop working after the update.
        You will need to update them manually.
      </Translate>
    </b>
    <br />
    <Translate translationKey="Character support revert warning">
      After selecting this option, you will not be able to revert back to using legacy property
      naming. If you are not facing issues with your template property names, we recommend leaving
      this unchecked.
    </Translate>
  </>
);

export const analytics = (
  <Translate translationKey="Analytics description">
    If you want to track analytics related to your collection visits, Uwazi supports both Google
    Analytics and Matomo.
  </Translate>
);

export const mapAxis = (
  <Translate>Set the default starting point for your geolocation properties.</Translate>
);

export const publicForm = [
  <Translate translationKey="Public form settings description">
    Here you can configure the public form destination and the whitelisted templates
  </Translate>,
  <Translate translationKey="Public form URL description">
    You can configure the URL of a different Uwazi to receive the submits from your Public Form
  </Translate>,
  <Translate translationKey="Public form whitelist description">
    If you wish to include a public form on your page, you must white-list the template by selecting
    it from the list.
  </Translate>,
];

export const mapTiler = (
  <Translate>We provide a default key, you can set your own MapTiler API key</Translate>
);
