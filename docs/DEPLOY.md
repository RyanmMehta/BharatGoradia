# Putting the site online

The live site is **https://bharatgoradia.org**, hosted on **Cloudflare Workers**. Cloudflare holds everything in
one place: the domain, DNS, the website and the enquiry database.

The code is on the branch **`claude/sleepy-cray-cohvcw`**. There is no `main` branch yet, so pick that branch
wherever a host asks.

The site runs in **prototype mode**: placeholders are labelled and search engines are told not to index it.
Keep `SITE_MODE` unset (prototype) until `npm run check:content` reports no launch blockers.

## Cloudflare Workers (live: https://bharatgoradia.org)

- **Automatic deploys:** the Worker `bharat-goradia` is connected to `RyanmMehta/BharatGoradia`. Every push to
  `claude/sleepy-cray-cohvcw` builds (`npm run build`) and deploys (`npx wrangler deploy`). Pushes to other
  branches build a preview version instead. Build logs: **Workers & Pages → bharat-goradia → Deployments**.
- **Domains:** `bharatgoradia.org` and `www.bharatgoradia.org` are custom domains on the Worker. Cloudflare
  manages their DNS records and certificates, so there are no records to edit by hand. Both addresses serve the
  site; canonical links and the sitemap use `https://bharatgoradia.org`.
- **Test address:** `https://bharat-goradia.rm6886.workers.dev`.
- **Enquiries:** the contact form runs in the Worker and stores enquiries in the D1 database
  `bharat-goradia-enquiries`, so they are kept permanently. The table is created on the first enquiry.
- **Cron trigger:** every 15 minutes the Worker retries undelivered notification emails and deletes enquiries
  older than 90 days.

What is set up in the code:

- `wrangler.jsonc`: the Worker name, the D1 binding (`DB`) and the cron trigger.
- `astro.config.mjs` switches to Cloudflare's adapter when Cloudflare builds it (`WORKERS_CI=1`). Pages are
  static files served by the Worker.
- To try the Cloudflare version locally: `DEPLOY_TARGET=cloudflare npm run build`, then
  `npx wrangler dev --config dist/server/wrangler.json`.
- To deploy by hand (normally not needed): `DEPLOY_TARGET=cloudflare npm run build`, then `npx wrangler deploy`.

Email notifications (optional until real visitors use the form): under the Worker's
**Settings → Variables and Secrets**, add `NOTIFY_PROVIDER=resend`, `NOTIFY_FROM`, `NOTIFY_TO`,
`NOTIFY_BACKUP_TO`, and `RESEND_API_KEY` as a **Secret**. Without them, enquiries are still saved in D1 and
notifications are only written to the Worker's logs.

To read enquiries: **Storage & Databases → D1 → bharat-goradia-enquiries → Console**, then run
`SELECT created_at, name, email, phone, message, delivery_state FROM enquiries ORDER BY created_at DESC;`

## Vercel (previous host: https://bharat-goradia.vercel.app)

The site was on Vercel until October 2026. `bharatgoradia.org` and `www.bharatgoradia.org` have been removed
from the Vercel project and now point to Cloudflare. The Vercel project still builds on every push until it is
deleted (**Settings → Advanced → Delete Project**). Its contact form never kept enquiries, because Vercel
functions only have temporary storage.

## Other hosts

The repository also includes a `Dockerfile` that Railway and Fly.io both use, in case the site ever needs to
run somewhere other than Cloudflare. Check each host's current pricing before you start.

### Option A: Railway (everything in the browser)

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

### Option B: Fly.io (uses a command-line tool)

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

### After it is online (Railway or Fly)

- Contact-form messages are stored on the server, but nobody is emailed until an email provider is set up.
  To set one up, add `NOTIFY_PROVIDER=resend`, `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_TO` and
  `NOTIFY_BACKUP_TO` as environment variables (Railway: **Variables**; Fly: `fly secrets set NAME=value`).
- To see stored messages:
  Railway: open the service's **shell** and run `node scripts/enquiry-maintenance.ts --list`.
  Fly: `fly ssh console -C "node scripts/enquiry-maintenance.ts --list"`.
- Keep `SITE_MODE` as `prototype` until `npm run check:content` reports no launch blockers.
