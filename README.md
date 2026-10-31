# KeenKeep

KeenKeep is a patient and caregiver support application.

## Local development

```sh
npm install
npm run dev
```

## Firebase project

This isolated copy is configured for the dedicated Firebase project `keenkeep-live-2026`, using the web app registered for the project. Client SDK settings live in `firebase-applet-config.json`. Firebase CLI settings are in `.firebaserc` and `firebase.json`.

The project is set to use the Standard Firestore database `(default)` in `asia-south1` (Mumbai), with the repository's `firestore.rules`. Before Firestore-backed features work, enable the Cloud Firestore API and provision the database in the Firebase project, then deploy the rules. Email/password Auth is configured; Google sign-in still needs to be enabled for this project.

The current notification UI uses browser notifications while the app is open. Background FCM delivery still needs project-specific Web Push credentials and a trusted server sender.
