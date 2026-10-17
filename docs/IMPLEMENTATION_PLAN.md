# Implementation plan and status

This tracks the build against the [PRD](PRD.md). "Done" means implemented and checked in this repository with
placeholder content. Items that depend on owner decisions or real content are marked as such.

## Technical choices (PRD §17)

| Need | Choice | Why |
| --- | --- | --- |
| Public pages | Astro 7, prerendered static HTML | Copy and navigation in the initial HTML, very little JavaScript, built-in responsive images |
| Editor | Keystatic, git-backed | Structured forms with plain-language labels. GitHub sign-in in production, so no custom password system. Every edit is a commit, which gives revision history and restore |
| Enquiry service | One Node server route + SQLite (`node:sqlite`) | Durable storage with no extra service and no native dependencies |
| Email notifications | Provider interface, with Resend implemented | Swappable. `NOTIFY_PROVIDER=log` for development |
| Fonts | Atkinson Hyperlegible Next (reading text, designed for low-vision readers) and Gloock (headings), self-hosted | Legibility for older readers and a distinctive poster-style display face. No third-party font requests |
| Analytics | Provider-neutral `track()` dispatcher | Works with Plausible or a tag manager once one is chosen. Sends identifiers only |

Measured in the current prototype: homepage first-load JavaScript is about 3 KB compressed, well under the
200 KB budget. Fonts and placeholder images together are well under 1.5 MB. Measure again with real photographs.

## P0 status

| PRD item | Status | Notes |
| --- | --- | --- |
| Four public pages + privacy (§6) | Done | `/`, `/gallery`, `/recognition`, `/contact`, `/privacy`, plus a 404 page |
| Navigation (§6) | Done | All destinations visible as text at every width, with no hidden menu. Sticky header only on large screens. Contact details repeated in the footer |
| H-01 Opening introduction | Done | Text first on phones, then the portrait. "Watch an introduction" appears only when an intro video is selected |
| H-02 With the artists | Done | Permanent captions, people, event, Bharat's role. Portrait photos are letterboxed, never face-cropped. Editor-set focal point |
| H-03 Featured videos | Done | Players load only after Play. One video at a time. Portrait videos keep a 9:16 frame. Source link always visible. Offline and file-error messages. YouTube uses privacy-enhanced mode with captions on |
| H-04 Services | Done (draft copy) | Three services + "How an enquiry works". Wording awaits Bharat's confirmation |
| H-05 Recognition preview | Done (placeholders) | Award vs honour labelled. Evidence fields are private and never rendered |
| H-06 Testimonials | Done (placeholders) | Static cards, greetings labelled separately. Unapproved quotes never publish |
| H-07 Contact summary | Done | |
| Gallery (§8) | Done | Curated order, 12 items then an explicit "Show more" button that moves focus and announces the count. Year-only dates supported |
| Recognition page (§9) | Done | Awards + selected press |
| Contact page + copy email (§10) | Done | Large stacked actions in the PRD's order. Copy with an announced confirmation and a select-text fallback. Links open in the same tab |
| Enquiry form (§10) | Done | Server validation keeps the visitor's text. Idempotent request IDs plus duplicate detection. Success only after durable storage. Timeout and safe retry. Email alternative on failure. Honeypot. Rate limit. 90-day retention. Background notification with backoff. Owner alert after repeated failure. Acknowledgement sent at most once. Works without JavaScript |
| Visual system (§11) | Done | Tokens in `src/styles/global.css`. Gold used only for decoration on ivory |
| Motion (§12) | Done | CSS hero entrance (≤12 px, 400 ms). Once-only image reveal. Reduced motion and data-saver disable it. A fail-safe removes the hidden state if scripts fail |
| Accessibility (§13) | Automated pass | axe (WCAG 2.2 AA + best practice): no violations on any page at 390 and 1440 px. No horizontal scroll at 320/390/768/1024/1440. **Manual screen reader and older-participant testing still required** |
| CMS (§15) | Done | Dashboard actions match the PRD wording ("Add photos", "Add a video", …). Draft/published/archived. Move items with the homepage selection lists. Required-field and format validation. Revision history through git |
| SEO (§18) | Done | Unique titles and descriptions, canonical URLs, sitemap, robots, social image. Person structured data only from confirmed fields and only in launch mode |
| Privacy page (§18) | Draft | Describes the actual implementation. Needs owner/legal review |
| Analytics (§18) | Partly done | Events wired: contact email, social and phone clicks, copy email, form attempt/error/accepted, video start. **Provider not chosen** |
| Monitoring (§17) | Partly done | Enquiry delivery alerts are built in. Uptime monitoring depends on the hosting choice |
| Launch gate (AC-03, AC-12, AC-14) | Done | `npm run check:content` and the launch build refuse placeholders, unconfirmed contact details and unapproved items |

## Before launch: owner decisions and content (PRD §2, §19)

1. Confirm the name, business name, one-line description, introduction and biography. Tick the
   confirmations in **Edit contact details**.
2. Confirm the official email, Instagram and Facebook links. These are launch blockers.
3. Provide approved photographs (6–8), three videos with captions, award evidence, and up to three testimonials
   with written consent.
4. Choose hosting, domain, email provider (and set `NOTIFY_TO` / `NOTIFY_BACKUP_TO`), and analytics provider.
5. Create the Keystatic GitHub app for production editing (see `.env.example`). Add Bharat or a family
   editor as repository collaborators.
6. Review the privacy text and confirm the 90-day enquiry retention.

## Testing still to do

- Manual keyboard, VoiceOver/Safari and NVDA or JAWS/Windows passes (AC-07).
- Moderated sessions with older participants (AC-02, PRD §3 targets).
- Real devices: iPhone Safari, Android Chrome, one older mid-range phone (§21).
- End-to-end enquiry delivery with the chosen email provider (AC-08, AC-09).
- Performance measurement with real photographs on a mid-range mobile profile (AC-11).
- Editor acceptance session: add, preview, publish, reorder, restore (AC-10).

## P1 candidates (after the core is approved)

Photo enlargement dialog, optional hero montage, optional phone action (already supported in settings),
event story pages, gallery filters once the collection is large enough.
