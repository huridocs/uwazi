/* eslint-disable max-len */
import React from 'react';
import { Translate } from 'app/I18N';

export const landingPageTip = (
  <Translate translationKey="Landing page description">
    {`The landing page is the first page that visitors see when they come to your collection. The default landing page is your collection's library. You can set a different landing page by adding its relative URL here.
      For example:
      
      A page: */page/dicxg0oagy3xgr7ixef80k9*
      A filtered view in Uwazi: */library/?searchTerm=test*
      An entity: */entity/9htbkgpkyy7j5rk9*
      A document: */document/4y9i99fadjp833di*
      
      Important: You must use relative URLs. These start with a forward slash and do not include the domain name. For example: In the address *https://yoursite.com/landingpage*, the relative URL is /landingpage
      `}
  </Translate>
);

export const customFavIcon = (
  <Translate translationKey="Favicon description">
    {`A favicon is a small icon that represents your collection in browser tabs and bookmarks. The
      default favicon is the Uwazi logo. To use your own:

        1. Upload your icon in Custom Uploads.
        2. Copy its URL.
        3. Choose "Custom Icon" and paste the URL in the indicated field.
        4. Reload the page to see your favicon in action.
      `}
  </Translate>
);

export const publicSharing = (
  <Translate>
    Check to make this instance private (only logged-in users can access the data)
  </Translate>
);

export const cookiePolicy = (
  <Translate>
    This option will show a notification about the use of cookies in your instance.
  </Translate>
);

export const receivingEmail = (
  <>
    <Translate translationKey="Receiving email description">
      If you have a contact form, this is the email address that will receive the form's
      submissions.
    </Translate>
    &nbsp;
    <Translate>Click</Translate>&nbsp;
    <a
      href="https://uwazi.readthedocs.io/en/latest/admin-docs/managing-settings.html#how-to-configure-a-contact-form-or-submission-form"
      target="_blank"
      rel="noreferrer"
      className="underline text-primary-700 hover:text-primary-900 visited:text-primary-700"
    >
      <Translate>here</Translate>
    </a>
    &nbsp;
    <Translate>to learn how to add and configure a contact form on a webpage.</Translate>
  </>
);
export const emails = [
  <Translate translationKey="Contact email description">
    Here you can set up the contact email and the email that appears when Uwazi sends a notification
    to a user
  </Translate>,

  <Translate translationKey="Sending email description">
    {`This is the email address that will appear as the sender when an email is sent from your Uwazi
    collection to registered users. The default address is *no-reply@uwazi.io*. You can set a custom
    one by including your desired email address here.`}
  </Translate>,
];

export const characterSupport = (
  <>
    <Translate translationKey="Character support description">
      This option enhances support for non-Latin languages as the default languages of your
      collection. Selecting this option will update all template properties automatically. The
      process could take several minutes. Selecting this option will likely change the URLs of
      library filters. As a consequence, if you have menus or links using such URLs, they will
      probably stop working. You will need to update them manually. After selecting this option, you
      will not be able to revert back to using legacy property naming. If you are not facing issues
      with your template property names, we recommend leaving this unchecked.
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
    If you have configured a public form and would like a different Uwazi collection to receive the
    submissions, enter its URL here.
  </Translate>,
  <Translate translationKey="Public form whitelist description">
    If you wish to include Public Forms on your pages, you must white-list the template IDs for
    which Public Forms are expected.
  </Translate>,
];

export const openPublicForm = (
  <Translate translationKey="Captcha bypass">
    By toggling this on you can allow users to submit to your whitelisted templates without having
    to fill a CAPTCHA. The form will still present the captcha to end users, but API end-point will
    allow submissions without CAPTCHA validation if a header `&ldquo;Bypass-Captcha: true`&ldquo; is
    sent along. This option is insecure and can be leveraged to flood your instance with spam or
    malicious content.
  </Translate>
);

export const mapApiKey = (
  <Translate translationKey="Map api key tooltip">
    An API key is required to use Mapbox or Google Maps.
  </Translate>
);

export const ocrTrigger = (
  <>
    <Translate translationKey="OCR description tip 1">
      This will enable the Optical Character Recognition (OCR) functionality for PDF documents. This
      service will recognize text inside images, such as scanned documents and photos, and convert
      it into machine-readable text data.
    </Translate>
    <br />
    <Translate translationKey="OCR description tip 2">
      When activated, this will enable administrator and editor users to send PDF documents to the
      OCR service.
    </Translate>
  </>
);

export const globalJS = (
  <>
    <Translate>With great power comes great responsibility!</Translate>
    <br />
    <br />
    <Translate>
      This area allows you to append custom Javascript to the page. This opens up a new universe of
      possibilities.
    </Translate>
    <br />
    <Translate>
      It could also very easily break the app. Only write code here if you know exactly what you are
      doing.
    </Translate>
  </>
);
