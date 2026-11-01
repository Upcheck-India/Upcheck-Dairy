# Privacy Policy — Upcheck Dairy

_Effective: [EFFECTIVE DATE] · Last updated: [LAST UPDATED]_

> Host this page at a public URL (e.g. `https://upcheckdairy.com/privacy`) and enter that
> URL in Google Play Console → Store listing → Privacy Policy. It is also shown in-app at
> **Profile → Privacy Policy**.
> Source of truth: `frontend/src/legal/content.ts` — edit there first, then mirror here.
> Do not name internal technology here: processors we send user data to must be
> disclosed, but databases, frameworks, hashing algorithms and libraries are
> implementation detail. Complete every `[PLACEHOLDER]` before publishing.

**Upcheck Technologies** ("we", "us", "our") operates the **Upcheck Dairy** mobile application (the "App"), a dairy farm-management tool for milk producers. This Privacy Policy explains what personal data we collect, why, how we use and share it, and the choices you have.

## 1. Information we collect

- **Account and identity:** your email address and name, and — where you provide them — your phone number, village, district, state and PIN code. Passwords are stored only as salted one-way hashes; never in plain text. If you enable two-factor authentication we also store the secret that generates your codes.
- **Sign-in provider data:** with Google sign-in we receive the email address, name and profile photo URL on your Google account, along with Google's stable identifier for that account.
- **Farm records you enter:** farms; animals (ear tag number, breed, date of birth, lactation stage, parentage); milk entries (morning and evening volume, fat %, SNF % and rate); health events and treatments; vaccinations; breeding events; tasks; inventory items; and financial transactions.
- **Photos and files you attach:** pictures of animals and documents such as receipts are uploaded to and stored on our servers.
- **Assistant conversations:** the questions you ask the in-app GauGuru assistant and the replies it gives are stored against your account so your history is there when you return.
- **Voice recordings:** when you use voice input, the audio is sent to OpenAI to be converted to text and, for spoken replies, to generate audio. We do not keep the recording once it has been processed.
- **Technical data:** app version, device model and operating system, and server-side request logs used for diagnostics and abuse prevention.

## 2. How we use your information

To create and secure your account and verify your email address; to provide the App's features — storing and displaying your farm records, calculations, reports and reminders; to send transactional email such as verification and password-reset codes; to operate, maintain, troubleshoot and improve the service; and to meet legal obligations.

**We do not sell your personal data, we do not use it for advertising, and the App contains no ad networks or advertising trackers.**

## 3. Device permissions we request

| Permission | What it is used for |
|---|---|
| Camera & photos | Taking or choosing pictures of animals, and photographing receipts you attach to records |
| Microphone | Voice input to the assistant |
| Notifications | Reminders for vaccinations, heat cycles and milking, **scheduled and shown by your own device** — we do not operate a push server and do not collect a push token |
| Location | Requested on the Permissions screen in preparation for location-aware features. **This release does not collect, store or transmit your coordinates**, and the weather shown on the Today screen is sample data, not a live forecast for your area. You may decline it without losing any functionality |
| Network state | Detecting when you are offline so entries can be queued and synced later |

You can grant or revoke any permission from your device settings at any time. The Permissions screen in the App shows the current status of each one.

## 4. How we share information (processors)

We share data only with providers that process it on our behalf under contract:

| Provider | Purpose |
|---|---|
| OpenAI | Speech-to-text, assistant replies and image generation — only when you use those features |
| Google | Sign-in — only if you choose to sign in with Google |
| [Cloud hosting provider] | Hosts the servers and database that store your farm records |

We do **not** share individual farm yields, animal records or financial ledgers with cooperatives, government bodies, corporations or competitors. We may disclose information where required by law, or to protect the rights, safety and security of our users and the service.

## 5. Retention and deleting your account

We keep your account and farm records for as long as your account exists.

**This release does not yet include an in-app "Delete account" control.** To have your account and the farm data you own permanently deleted, email **support@upcheckdairy.com** from your registered address and we will action the request within 30 days. Backups and any records we are legally required to retain may persist for a limited period before being purged. One-time codes and expired sign-in tokens are discarded automatically.

## 6. Your rights and choices

You can view and correct your profile and farm details in the App, change your language and notification preferences, and revoke device permissions at any time. The App does not yet have a one-tap export: to receive a copy of your records, or to exercise any right of access, correction, portability or restriction you have under applicable law, email **support@upcheckdairy.com** and we will respond within 30 days.

## 7. Security

Traffic between the App and our servers is encrypted in transit. Passwords are stored as salted one-way hashes. Sessions use short-lived tokens that are refreshed automatically, so a stolen token is usable only for a narrow window. On your device, session tokens are held in the platform's secure keystore rather than in ordinary app storage, and access to your records is checked against your account on every request. No system is perfectly secure and we cannot guarantee absolute security.

## 8. Data held on your device

Records you create without a connection are stored in your device's app storage until they sync. That copy is under your control, not ours — it is removed when you uninstall the App or clear its storage, and anything not yet synced is lost with it.

## 9. Children

The App is a business tool for dairy farmers and is not directed to children. We do not knowingly collect personal data from anyone under 18.

## 10. Changes and contact

We may update this policy; material changes will be notified in the App or by email.

Questions or requests: **legal@upcheckdairy.com**
Upcheck Technologies, [Registered office address].
