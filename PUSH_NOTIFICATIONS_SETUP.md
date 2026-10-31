# KeenKeep phone push notifications

The app now registers an FCM token for the signed-in user and selected patient after the user taps **Enable phone alerts**. The service worker displays data-only task and SOS messages as operating-system notifications, including when the web app is in the background. Foreground task/SOS notification events are handled from FCM rather than a second Firestore listener, so the same event is not displayed twice.

## Production setup required

1. In Firebase Console for `keenkeep-live-2026`, open **Project settings → Cloud Messaging → Web configuration**, create a Web Push certificate key pair if one is not present, and copy its public key.
2. Add `VITE_FIREBASE_VAPID_KEY` to the Vercel project's Production (and Preview, if needed) environment variables, then redeploy `kk-nine-beta.vercel.app`. The public key belongs in this Vite-prefixed variable; never put a service-account private key in a `VITE_` variable.
3. This repository includes Firestore-triggered Functions in `functions/` for task schedule changes and SOS creation/resolution. Deploying these requires the Firebase project to use the Blaze billing plan. The currently linked project reports billing disabled, so the triggers cannot be deployed until its owner enables billing. No billing plan was changed.
4. After the billing plan is enabled, deploy the Firestore rules and Functions from this repository with `firebase deploy --only firestore:rules,functions` while `keenkeep-live-2026` is selected. Vercel deploys the front end separately.
5. On each phone, sign in, open **Settings → Notifications → Enable phone alerts**, and allow OS notifications. On iPhone/iPad, install the site to the Home Screen and open that installed app before granting permission (iOS/iPadOS 16.4+). Android browsers generally support web push after permission is granted. Lock-screen display and sound are ultimately controlled by the phone's notification settings.

The Firebase Web Push public key and the app's Firebase web config are public client configuration. Firebase Admin credentials must not be committed or exposed to the browser; Cloud Functions use the project's managed service identity.

## What is notified

- Task added, removed, edited, rescheduled, or completed.
- New active SOS sent to registered caregiver devices for that patient.
- SOS resolution sent to registered caregiver devices.

Only user-approved devices are registered. Token documents are scoped to the signed-in UID and the patient's connected caregiver relationship in Firestore rules. Invalid FCM tokens are removed by the function sender.
