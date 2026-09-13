# Friend Dossier

A tiny, privacy-friendly notebook for remembering useful details about the people in your life.

## Features

- Add, edit and delete people
- Important dates
- Allergies / things to avoid
- Likes and interests
- Gift ideas
- General notes
- Custom fields for anything else
- Search
- Local browser storage
- JSON export/import backups
- Mobile-friendly layout
- No database and no account required

## Data privacy

The app uses `localStorage`, meaning your people data stays in the browser on the device where you entered it.

The GitHub repository only contains the app code. It does **not** contain the people you add.

Because browser storage is device-specific, use **Export backup** if you want to preserve or move your data.

## GitHub Pages

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and `/ (root)`.
4. Save.

## Future app version

This structure is intentionally simple. A future version could become a PWA or be wrapped with Capacitor for Android/iOS, then optionally add encrypted sync.
