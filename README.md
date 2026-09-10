# Coinspira — MVP website

This folder is ready to publish as a static website with GitHub + Vercel.

## Files

- `index.html` — the website
- `assets/coinspira-logo.png` — approved white/orange logo for the black header
- `assets/favicon-512.png` — browser favicon
- `assets/apple-touch-icon.png` — icon for Apple devices
- `vercel.json` — minimal Vercel configuration
- `.gitignore` — ignores local/system deployment files

## Publish with GitHub + Vercel

1. Create a new GitHub repository, for example `coinspira-site`.
2. Upload **the contents of this folder** to the root of that repository.
3. Commit the files.
4. In Vercel, choose **Add New → Project** and import the GitHub repository.
5. Framework preset: **Other**.
6. Root Directory: leave as `./`.
7. Build Command: leave empty.
8. Output Directory: leave empty.
9. Click **Deploy**.

Vercel will serve `index.html` automatically.

## Updating the site later

Edit or replace `index.html`, commit the change to GitHub, and Vercel will redeploy automatically.

## Custom domain

After deployment, add your domain under:

**Vercel → Project → Settings → Domains**

Then follow Vercel's DNS instructions for your registrar.

## Note

The page uses Google Fonts from the web. No npm install, build system, database, or server is required.
