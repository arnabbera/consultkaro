# ConsultKaro Admin activation

The admin editor is already restricted in both the interface and Firebase rules to the verified Google account `beraarnab@gmail.com`.

## One-time Firebase setup

1. Create or select the Firebase project intended for ConsultKaro.
2. In **Authentication > Sign-in method**, enable **Google**.
3. In **Authentication > Settings > Authorised domains**, add:
   - `consultkaro.org`
   - `www.consultkaro.org`
4. Create a Firestore database. Firebase Storage is not required for post images; the admin portal optimises both images and stores them with the protected Firestore post record.
5. The existing `consult-karo` Web app configuration is already present in `firebase-config.js`.
6. Deploy the included access rules from the project directory:

   ```bash
   firebase deploy --only firestore:rules
   ```

The Firebase Web configuration is safe to expose in a browser. Access is enforced by `firestore.rules` and `storage.rules`, which require a verified token for `beraarnab@gmail.com`.

## Admin workflow

Open `https://www.consultkaro.org/admin/`, sign in with the authorised account, complete the post form, and upload both:

- 16:9 landscape image (recommended 1920 × 1080)
- 9:16 portrait image (recommended 1080 × 1920)

Published posts and their browser-optimised WebP images are stored in Firestore, and published entries are loaded at the top of the Posts page.
