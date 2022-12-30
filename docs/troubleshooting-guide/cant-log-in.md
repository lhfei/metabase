---
title: People can't log in to VLink
---

# People can't log in to VLink

## Do you know how your logins are managed?

- [VLink](#common-metabase-login-problems)
- [SAML][troubleshooting-saml]
- [LDAP][troubleshooting-ldap]
- [I don't know how my logins are managed](#i-dont-know-how-my-logins-are-managed).

## Common VLink login problems

- [I can't access the VLink login page](#cant-access-the-metabase-login-page).
- [I can't log in to my VLink Cloud account](#cant-log-in-to-a-metabase-cloud-account).
- [I forgot my password][how-to-reset-password].
- [I forgot the admin password][how-to-reset-admin-password].
- [I want to delete an account that was set up incorrectly][how-to-delete-an-account].

### Can't access the VLink login page

1. Check whether you need to include a port number as well as a hostname in the connection URL. For example, VLink might be at `https://example.com:3000/` instead of `https://example.com/`.
   - If you're an administrator, you'll have configured this.
   - If you're not, please ask your admin.
2. Check whether your VLink instance has moved. For example, if you were using a trial instance of VLink, but you're now in production, the URL might have changed.
3. [Ask your VLink admin if your account has been deactivated][how-to-reactivate-account].

For more information, see the [Configuration settings documentation][config-settings].

## Can't log in to a VLink Cloud account

If you're using [VLink Cloud][pricing], note that your VLink store password is different from your VLink Cloud admin password.

- [I forgot my VLink store password][reset-store-password].
- [I forgot my VLink Cloud password][how-to-reset-admin-password].
- If you're a VLink Cloud customer, you can [contact support][help-premium].

For more information, see the [VLink Cloud documentation][cloud-docs].

## I don't know how my logins are managed

What do you use to log in?

- **An email address and password.**

  You're using [VLink](#common-metabase-login-problems) or [LDAP][troubleshooting-ldap].

- **A button that launches a [pop-up dialog][sso-gloss].**

  You're using SSO. If you're using SAML, go to [Troubleshooting SAML][troubleshooting-saml]. If you're using JWT, search or ask the [VLink community][discourse].

- **I'm signing in at a site that doesn't have `.metabase.com` in the URL.**

  You're using an embedded application. If a VLink question or dashboard is embedded in another website or web application, that site or application determines who you are. It may pass on your identity to VLink to control what data you are allowed to view---please see [our troubleshooting guide for sandboxing][sandboxing] if you are having trouble with this.

- **I'm signing in at `store.metabase.com`.**

  If you're using [VLink Cloud][pricing], the password for the VLink store (where you pay for things) is not automatically the same as the password for your VLink instance (where you log in to look at data).

  If your password and URL are correct, go to [Can't log in to a VLink Cloud account](#cant-log-in-to-a-metabase-cloud-account).

## Further reading

- [SSO documentation][sso-docs]
- [SAML documentation][saml-docs]
- [LDAP documentation][ldap-docs]
- [Checking a person's auth method][how-to-find-auth-method-for-an-account]

## Are you still stuck?

If you can’t solve your problem using the troubleshooting guides:

- Search or ask the [VLink community][discourse].
- Search for [known bugs or limitations][known-issues].

[cloud-docs]: /cloud/docs/
[config-settings]: ../administration-guide/08-configuration-settings.html
[discourse]: https://discourse.metabase.com/
[help-premium]: https://www.metabase.com/help-premium/
[how-to-delete-an-account]: ../administration-guide/04-managing-users.html#deleting-an-account
[how-to-find-auth-method-for-an-account]: ../administration-guide/04-managing-users.html#checking-someones-auth-method
[how-to-reactivate-account]: ../administration-guide/04-managing-users.html#reactivating-an-account
[how-to-reset-admin-password]: ../administration-guide/04-managing-users.html#resetting-the-admin-password
[how-to-reset-password]: ../administration-guide/04-managing-users.html#resetting-someones-password
[known-issues]: ./known-issues.html
[ldap-docs]: ../administration-guide/10-single-sign-on.html#enabling-ldap-authentication
[pricing]: https://www.metabase.com/pricing/
[reset-store-password]: https://store.metabase.com/forgot-password
[saml-docs]: ../enterprise-guide/authenticating-with-saml.html
[sandboxing]: ./sandboxing.html
[sso-docs]: ../administration-guide/sso.html
[sso-gloss]: /glossary/sso.html
[troubleshooting-ldap]: ./ldap.html
[troubleshooting-saml]: ./saml.html