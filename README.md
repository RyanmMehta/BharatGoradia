# Bharat Goradia / V International website

Business website for Bharat Goradia: Bollywood artist promotion, celebrity appearances and cultural events.
Built to the [PRD](docs/PRD.md): four public pages, large readable text, accessible motion, on-demand video,
a dependable enquiry form, and a private editor that needs no code.

> **Status: prototype.** All content is clearly labelled placeholder content awaiting owner approval.
> Prototype builds are hidden from search engines. See [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
> for what is done and what is still needed before launch.

## Quick start

Requires Node.js 22.13 or later.

```sh
npm install
cp .env.example .env
npm run dev          # http://localhost:4321 (site) and http://localhost:4321/keystatic (editor)
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Local development server, with the content editor at `/keystatic` |
| `npm run build` | Content readiness check, then production build into `dist/` |
| `npm start` | Runs the built site (`dist/server/entry.mjs`) |
| `npm test` | Unit tests for the enquiry service |
| `npm run check` | TypeScript and Astro checks |
| `npm run check:content` | Lists everything that still blocks launch (placeholders, unconfirmed contact details, missing approvals) |
| `npm run enquiries:retry` | Retries undelivered enquiry notifications and deletes enquiries past retention. Run every 15 minutes in production |

## Prototype and launch modes

`SITE_MODE=prototype` (the default) shows placeholders with a visible **Placeholder** label, adds a prototype
banner, and sets `noindex` plus a `Disallow: /` robots.txt.

`SITE_MODE=launch` withholds every placeholder and makes pages indexable. The build **refuses to run** while
anything in `npm run check:content` blocks launch: unconfirmed contact details, published placeholders, or
missing homepage items.

## How it fits together

- **Astro** prerenders the public pages to static HTML, so all copy and navigation are in the initial HTML.
  Client JavaScript is small and only enhances: video players, copy-email, the form and "Show more".
- **Content** lives as JSON in `src/content/` (photos, videos, services, awards, testimonials, press) and
  `src/data/` (site settings, homepage selections), validated by `src/content.config.ts`.
  Only items that are `published` **and** approved (rights, award evidence, testimonial consent) appear.
- **Keystatic** (`keystatic.config.ts`) is the editor. In development it writes files directly. In production
  it uses GitHub sign-in and commits to this repository, and each commit redeploys the site.
- **Enquiries** go to a small server route (`src/pages/api/enquiry.ts`, plus `src/pages/contact/send.astro` for
  no-JavaScript visitors). Each enquiry is validated, stored in SQLite, and the owner is notified in the
  background with retries. See `src/lib/enquiry/`.

```
src/
  components/     Header, Footer, Hero, PhotoCard, VideoCard, AwardCard, TestimonialCard, ContactActions, EnquiryForm
  content/        Editable collections (JSON)
  data/           Site settings and homepage selections (JSON)
  lib/site.ts     Publication rules and content helpers
  lib/enquiry/    Validation, storage, notifications, retries
  pages/          /, /gallery, /recognition, /contact, /privacy, API routes
  scripts/        Small client-side enhancements
  styles/         Design tokens and global styles
scripts/          Content check, enquiry maintenance, social image generator
tests/            Enquiry service tests
docs/             PRD, implementation plan, owner guide
```

## Deploying

Any host that runs a long-lived Node.js process with a persistent disk works, for example a small VPS, Render,
Railway or Fly.io. The enquiry database must sit on persistent storage.

1. Set the environment variables in `.env.example`. In particular, `SITE_URL` must be the public address,
   because form submissions are rejected when their origin does not match.
2. `npm ci && SITE_MODE=launch npm run build && npm start`
3. Schedule `npm run enquiries:retry` every 15 minutes.
4. Back up the `ENQUIRY_DB_PATH` file along with the server's normal backups.

The hosting, email provider, analytics and domain are still open decisions in the PRD. The code keeps each
behind a small interface so the choice can be made later.
