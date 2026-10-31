# KeenKeep push notifications with OneSignal

KeenKeep uses OneSignal Web Push for browser subscriptions and delivery. Firebase remains the source of truth for tasks, SOS alerts, user roles, and task due times. Firebase Functions send OneSignal notifications after Firestore changes and on the due-time schedule; OneSignal REST credentials are server-only.

## One-time OneSignal setup

1. In OneSignal, create an app and enable **Web Push** with **Custom Code** integration. Set the site URL to the exact production origin: `https://kk-nine-beta.vercel.app`. Add another OneSignal app for each different origin you use for subscriptions (for example, localhost or a separate preview domain).
2. In **Settings → Keys & IDs**, copy the **App ID**. This is public client configuration. Add it as `VITE_ONESIGNAL_APP_ID` in Vercel for Production (and Preview if the same OneSignal app is configured for that origin), then redeploy.
3. Copy the OneSignal **App API Key** into Firebase Functions secrets. Never use a `VITE_` variable for this key and do not commit it:

   ```sh
   npx -y firebase-tools@latest functions:secrets:set ONESIGNAL_REST_API_KEY --project keenkeep-live-2026
   ```

4. Put the public OneSignal App ID in the local Firebase Functions environment file `functions/.env.keenkeep-live-2026` (this file is gitignored):

   ```env
   ONESIGNAL_APP_ID=your-onesignal-app-id
   ```

5. Sign in to Firebase CLI if needed, then deploy the current repository's Firestore rules and Functions:

   ```sh
   npx -y firebase-tools@latest login
   npx -y firebase-tools@latest deploy --only firestore:rules,functions --project keenkeep-live-2026
   ```

   This project currently has billing disabled. The task/SOS event triggers and once-per-minute scheduled reminders require Cloud Functions and Cloud Scheduler, which require the Firebase project to be on Blaze. Do not enable billing without the project owner's approval. If billing stays disabled, browser subscription/OneSignal test sends can work, but automatic Firestore task/SOS notifications and scheduled reminders will not run.

## User/device setup

1. Open the deployed site on HTTPS, sign in, open **Settings → Notifications → Enable phone alerts**, and allow the browser's native notification prompt.
2. Confirm the subscription appears as **Subscribed** under OneSignal **Audience → Users & subscriptions → Subscriptions**.
3. To test a real send, add that subscription as a OneSignal Test User, create a `Test Users` segment, and send the dashboard/API test notification. Confirm it arrives in the phone notification shade/lock screen; browser and OS notification settings control presentation.
4. For an iPhone/iPad, install the site to the Home Screen and open the installed web app before enabling notifications. iOS/iPadOS Web Push requires version 16.4 or later.

## What gets sent

- New, removed, changed, rescheduled, or completed task notifications to subscribed users registered for that patient.
- One reminder at the task's due time (within a five-minute window) to subscribed users registered for that patient.
- Active SOS and SOS resolution notifications to subscribed caregiver devices registered for that patient.

The sender targets OneSignal `external_id` values that match authenticated Firebase UIDs and filters recipients through Firebase's `notificationDevices` records. A successful OneSignal API response means the message was accepted for processing; final display depends on the device/browser subscription and OS notification settings.

## App behavior and security

- The browser loads the OneSignal Web SDK v16 and uses the existing root service worker path (`/sw.js`) so existing installations can update the same worker scope.
- The SDK links the signed-in Firebase UID to OneSignal. The app prompts for permission only after the user taps **Enable phone alerts**.
- Firestore stores the user's OneSignal external ID and patient/role association, never the REST API key or FCM token.
- The Firebase Functions managed service identity calls OneSignal's server API using `ONESIGNAL_REST_API_KEY`; that secret is never bundled into the website.
