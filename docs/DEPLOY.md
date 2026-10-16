# Putting the prototype online

The repository includes a `Dockerfile` that Railway and Fly.io both use. It builds the site in **prototype mode**:
placeholders are labelled and search engines are told not to index it. The content editor is not included in
the online version. Content is edited locally or through the GitHub editor once that is set up.

The code is on the branch **`claude/sleepy-cray-cohvcw`**. There is no `main` branch yet, so pick that branch
wherever a host asks.

Check each host's current pricing before you start. Plans and free allowances change often.

## Vercel (currently in use: https://bharat-goradia.vercel.app)

Vercel builds the site automatically. When it builds, the site switches to Vercel's adapter: pages are
served as static files, and the contact form runs as a serverless function.

- **Production branch:** `claude/sleepy-cray-cohvcw`. Every push to it redeploys.
- **Contact form storage:** Vercel functions can only write to temporary storage, so form messages on Vercel
  are **not kept** between requests or redeploys. That is fine for trying out the form. Before real visitors
  use it, connect a hosted database (for example Turso or Vercel Postgres) or switch to Railway/Fly with a volume.
- **Email notifications:** add `NOTIFY_PROVIDER=resend`, `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_TO` and
  `NOTIFY_BACKUP_TO` under **Settings → Environment Variables**, then redeploy.
- Keep `SITE_MODE` unset (prototype) until `npm run check:content` reports no launch blockers.

## Option A: Railway (everything in the browser)

1. Go to <https://railway.com> and sign in with GitHub.
2. Choose **New Project → Deploy from GitHub repo** and pick **RyanmMehta/BharatGoradia**.
   If it is not listed, choose **Configure GitHub App** and give Railway access to that repository.
   Because the repository belongs to Ryan's account, Ryan may need to approve this.
3. Open the new service, go to **Settings → Source**, and set the branch to `claude/sleepy-cray-cohvcw`.
4. In **Settings → Networking**, choose **Generate Domain**. If it asks for a port, enter `8080`.
   You get an address like `https://bharatgoradia-production.up.railway.app`.
5. Optional but recommended: right-click the service, choose **Attach volume**, and set the mount path to `/data`.
   This keeps contact-form messages when the site is redeployed.
6. Choose **Deploy** (or **Redeploy**) so the public address is built into the page links.

From then on, every push to the branch redeploys automatically.

## Option B: Fly.io (uses a command-line tool)

1. Install flyctl: <https://fly.io/docs/flyctl/install/>, then run `fly auth login`. Fly asks for a card when you sign up.
2. Get the code:
   ```sh
   git clone https://github.com/RyanmMehta/BharatGoradia.git
   cd BharatGoradia
   git checkout claude/sleepy-cray-cohvcw
   ```
3. Create the app from the included `fly.toml`:
   ```sh
   fly launch --copy-config --no-deploy
   ```
   If the name `bharat-goradia` is taken, choose another, then update `SITE_URL` in `fly.toml` to
   `https://<your-name>.fly.dev`.
4. Create the storage for contact-form messages, then deploy:
   ```sh
   fly volumes create enquiries --size 1 --region lhr
   fly deploy
   ```
5. Open the site with `fly open`. The address is `https://bharat-goradia.fly.dev` (or your chosen name).

The machine stops when nobody is visiting and starts again on the next visit, so the first page load after a
quiet spell takes a few seconds.

## After it is online

- Contact-form messages are stored on the server, but nobody is emailed until an email provider is set up.
  To set one up, add `NOTIFY_PROVIDER=resend`, `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_TO` and
  `NOTIFY_BACKUP_TO` as environment variables (Railway: **Variables**; Fly: `fly secrets set NAME=value`).
- To see stored messages:
  Railway: open the service's **shell** and run `node scripts/enquiry-maintenance.ts --list`.
  Fly: `fly ssh console -C "node scripts/enquiry-maintenance.ts --list"`.
- Keep `SITE_MODE` as `prototype` until `npm run check:content` reports no launch blockers.
