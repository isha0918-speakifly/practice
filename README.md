# Speaking Practice Web App

A simple web app where a student practises speaking English: 20 sentences a day for 30 days (600 sentences, short → long).

## Features
- Student enters name on first page
- 20 sentences per day, up to 30 days; unused sentences do not carry over to the next day
- Difficult words are highlighted with meanings; listen to any word or the whole sentence
- Record yourself, play it back, compare with the model voice (and see word-by-word recognition in Chrome/Edge)
- Progress is saved in the browser (same device) – the student resumes at the same sentence and day

## Run / Deploy
1. Upload all files to a GitHub repository.
2. Settings → Pages → Deploy from branch → `main` / root.
3. Open the https link. (Microphone needs https or localhost.)

## Customise
- Replace `logo.svg` with your logo (or change the `src` in `index.html` and the favicon).
- Edit sentences and word meanings in `sentences.js`.
- Change `DAILY` and `DAYS` at the top of `app.js`.
