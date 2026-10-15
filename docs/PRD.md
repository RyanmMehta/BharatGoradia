# Bharat Goradia / V International — Business Website PRD

Version: 1.0  
Date: October 15, 2026  
Status: Proposed implementation baseline for design and engineering  
Product sponsor: Ryan, with Bharat Goradia as business and content owner  
Platform: Responsive public website with a private content editor

## 1. Product brief

Create a professional business website for Bharat Goradia that communicates his work in Bollywood artist promotion, celebrity appearances, and cultural events. The website should establish personal credibility through real photographs, videos, awards, and testimonials, then make contacting him straightforward.

The approved creative direction is a polished entertainment agency website centered on Bharat: warm ivory reading surfaces, charcoal text, burgundy accents, restrained gold details, strong photography, a dark video section, and subtle motion. Visitors should understand the essentials by scrolling. The site must work well for older adults, people with low vision, and people who are less comfortable using websites.

The homepage is the complete introduction. Additional pages provide a larger media collection, detailed recognition, and an especially simple contact experience. A structured editor lets Bharat or a family member maintain content without touching code or arranging page layouts.

This PRD defines the proposed product. It does not imply that accounts, social handles, media permissions, testimonials, awards, or integrations have already been verified or implemented.

## 2. Decisions, assumptions, and unresolved items

### Confirmed user requirements

- Professional presentation suitable for an established entertainment business.
- Animations, video from Instagram/YouTube, photographs with celebrities, awards, and testimonials.
- Dedicated contact page featuring Instagram, email, and Facebook.
- Large readable text, minimal clicking, and suitability for older visitors.
- Straightforward maintenance and automation where it reduces work.

### Proposed defaults for the team

- English at launch; architecture permits additional languages later.
- Four primary destinations: Home, Gallery & Videos, Recognition, Contact.
- Bharat's name is the primary identity; V International appears as the business identity with his approval.
- Static portrait hero at launch, plus subtle entrance animation. A silent hero montage is optional and must meet the motion and performance rules below.
- A short enquiry form supplements direct email and social links.
- No public telephone number until Bharat confirms that he wants calls and approves the number.
- No automatic publication from social accounts. Imports, if added later, create drafts.
- Hosting, CMS, domain, operational budget, and delivery dates are selected during technical planning.

### Decisions needed before launch

| Decision | Owner | Default / implication |
| --- | --- | --- |
| Public brand wording and company styling | Bharat + Ryan | Use approved name and service description; do not infer corporate founding dates |
| Official email, Instagram and Facebook destinations | Bharat | Launch blocker for the requested contact experience |
| Photo/video rights and testimonial approval | Content owner | Only approved items can publish |
| Award wording, issuer, year and supporting evidence | Content owner | Publish supported details; omit uncertain fields |
| Form recipient and backup recipient | Bharat + Ryan | Needed for end-to-end delivery testing |
| Domain, CMS, hosting and recurring budget | Ryan + engineering | Required before production setup |
| Privacy text, enquiry retention and third-party media behavior | Owner + engineering | Confirm before production data collection |
| Who handles enquiries and content updates | Bharat + Ryan | Name a primary owner and backup |

These decisions should not block wireframes or component design. Use clearly marked placeholders in non-public prototypes.

## 3. Goals and success measures

### Business goals

1. Explain what Bharat does within the first screen.
2. Demonstrate relevant experience through a curated body of evidence.
3. Make enquiries easy for event organizers, cultural associations, brands, and prospective collaborators.
4. Allow routine content updates without developer involvement.

### User goals

- Understand his services without reading a long biography.
- Recognize his role in events and artist relationships through clear captions.
- Watch a relevant video without leaving the website when embedding is supported.
- Find and use the preferred contact method quickly.
- Browse at a comfortable reading speed without timed content changes.

### Proposed validation targets

| Measure | Target | Verification |
| --- | --- | --- |
| Service comprehension | At least 4 of 5 representative older participants explain his work after a brief homepage review | Moderated prototype test; directional sample, not statistical proof |
| Contact discovery | At least 4 of 5 locate and initiate a chosen contact action within 30 seconds, without help | Test on their familiar device |
| Media usability | At least 4 of 5 play and pause a clip without help | Include sound, captions and portrait video |
| Editorial independence | Bharat or designated editor adds a photo, previews it and publishes it in under 5 minutes after training | Observed CMS task |
| Technical reliability | All supported contact paths pass the release checklist | Staging and production verification |
| Enquiry conversion | Establish baseline during first 30 days | Report contact clicks separately from successful form submissions |

Do not claim that a social click or email-link click is a completed enquiry. No arbitrary conversion-rate promise is part of this PRD.

## 4. Audiences and key journeys

| Audience | Need | Intended path |
| --- | --- | --- |
| Community organizer, including older adults | Confidence that Bharat can help with a celebration | Home → services and selected work → Contact |
| Brand or event professional | Relevant experience, clarity and reliable communication | Home → selected media or recognition → enquiry |
| Artist or representative | Understand his public positioning and reach him | Home → Contact |
| Friend, family member or general visitor | View career highlights and media | Home → Gallery & Videos / Recognition |
| Bharat or family editor | Add content with minimal technical effort | Private editor → add item → preview → publish |

Primary journey: land on homepage, understand the service, view supporting work, contact Bharat. No account, search, filter, carousel or modal is necessary to complete this journey.

## 5. Scope and priorities

P0 means required for launch. P1 means optional enhancement after the core experience is complete. P2 means future scope requiring a separate estimate.

| Priority | Included |
| --- | --- |
| P0 | Four public pages, responsive layouts, accessible motion, approved photos/videos, awards, testimonials, direct contact links, short enquiry form, CMS, basic analytics, SEO, privacy page, monitoring and editorial handoff |
| P1 | Hero montage, photo enlargement dialog, optional phone action, additional event story pages, simple media filters once the collection justifies them |
| P2 | Authorized social imports into drafts, multilingual content, automated event scheduling/archive, CRM integration, advanced search |

Excluded from launch: artist booking marketplace, ticket sales, payments, visitor accounts, live chat, AI chatbot, public artist availability, scraped social feeds, automatic testimonial generation, and a complete historical archive.

## 6. Information architecture and navigation

| Route | Purpose | Required content |
| --- | --- | --- |
| `/` | Complete business introduction | Hero, photos, videos, services, awards preview, testimonials, contact summary |
| `/gallery` | Expanded photos and video | Selected media with captions and source links where useful |
| `/recognition` | Awards and selected press | Award cards, context, supporting images and links |
| `/contact` | Direct business contact | Email, Instagram, Facebook and optional enquiry form |
| `/privacy` | Explain data handling | Enquiries, analytics, media providers, retention and contact |
| Private editor route or separate admin domain | Maintain content | Authentication, editing, previews, publishing and revisions |

Desktop navigation shows all four destinations. Use “Contact Bharat” as the emphasized contact label. The logo/name returns home. On mobile, keep Home and Contact visible; Gallery & Videos and Recognition may appear in an accessible, text-labeled Menu when space is limited.

The header may stay visible, but must not cover headings, form errors, focused controls or significant screen area. On small screens, avoid simultaneously stacking a sticky header and a large sticky contact bar. All pages repeat direct contact details in the footer.

No loading splash screen, automatic page transitions that delay access, or forced fullscreen experience.

## 7. Homepage requirements

### H-01: Opening introduction — P0

- Show Bharat's name, approved business name, one clear service descriptor, one short supporting sentence, and Contact Bharat.
- Proposed descriptor: “Bollywood Artist Promotion & Celebrity Events.” This is draft copy, subject to business confirmation.
- Use a high-quality portrait or approved working photograph. Avoid cropping faces or covering them with text.
- Put text on a solid or reliably opaque surface.
- A secondary “Watch an introduction” action appears only when an approved clip exists.
- Avoid unverified superlatives, invented statistics, and claims of exclusive representation.

Acceptance: On a typical mobile screen, visitors can identify Bharat, understand his role and find Contact Bharat without opening a menu. The hero remains useful if video, animation or client JavaScript fails.

### H-02: With the artists — P0

- Display six curated photographs initially, expandable editorially to eight if the mobile page remains manageable.
- Use a consistent grid: one column on narrow screens, two or three when space permits.
- Each image has a permanent caption naming the people and event where known.
- Identify Bharat's specific role where supported; a photograph alone must not imply a booking, endorsement or current client relationship.
- The full gallery is optional to understanding this section.

Acceptance: Names and captions are readable without hover or opening an image. Portrait, landscape and low-resolution source assets each have deliberate treatments.

### H-03: Featured videos — P0

- Feature three approved clips: an introduction/interview, an event highlight, and a testimonial or clearly labeled greeting.
- Each card includes a cover image, title, duration and short description.
- Use a dark section with high-contrast text and clearly visible play controls.
- Start playback only after an explicit visitor action. Only one foreground video plays at a time.
- Load third-party players after activation; do not load several heavy embeds immediately.
- Preserve the source aspect ratio. Vertical footage uses a vertical frame with neutral surrounding space, not an aggressive landscape crop.

Acceptance: A visitor can identify a clip before playing it, start it, pause it, control sound and access captions. Failure to embed produces a readable message and a clearly labeled source link.

### H-04: Services — P0

Use three short service blocks, with final labels confirmed by Bharat:

1. Celebrity appearances: coordinating suitable appearances for events and organizations.
2. Live entertainment: connecting organizers with performers and supporting agreed arrangements.
3. Cultural events: supporting celebrations, community programs and cultural gatherings.

Keep descriptions specific to work actually offered. Do not promise production, travel, immigration, contracts or logistics services unless Bharat confirms those responsibilities. Add a brief explanation of the enquiry process: share your event, discuss suitable options, agree next steps.

Acceptance: The service section is readable as plain text and does not require choosing an artist or budget.

### H-05: Recognition preview — P0

- Show up to four approved awards or honors with title, issuer when established, date when established and one sentence of context.
- Use award photographs where available; do not manufacture medals, institutional logos or certificates.
- Link to Recognition for further context.
- Distinguish awards, honorary descriptions and press coverage visually and editorially.

Acceptance: Every published claim has an internal evidence record and approved wording. A venue is not presented as the awarding institution.

### H-06: Testimonials — P0

- Launch target: three approved testimonials; fewer genuine testimonials are preferable to filler.
- Each has an exact approved quote, name, role/organization where relevant, and optional approved photograph or video.
- Present quotes in static cards or stacked blocks.
- Keep meaningful quote text visible; do not require carousel navigation.
- Label celebrity greetings separately if they do not describe professional experience.

Acceptance: No fabricated or inferred endorsement appears. If approved testimonials are unavailable, the owner approves a temporary omission rather than publishing placeholders.

### H-07: Contact summary — P0

Repeat the approved email address and labeled Instagram and Facebook links. Include Contact Bharat linking to the dedicated page. Keep this section visually simple and large enough to use comfortably.

## 8. Gallery & Videos requirements

- Show a curated mix of images and video cards, with an understandable reading order.
- Default view exposes content immediately; filters are optional P1 enhancements.
- Initial display: up to 12 items. Additional items use an explicit Load more button, not infinite scroll.
- Loading additional items preserves position, announces the update, and leaves the footer reachable.
- Dates may have year-only precision; do not invent a day or month for sorting.
- Captions explain context and stay visible.
- No portrait-face cropping in automated thumbnails; allow an editor-selected focal point.
- If photo enlargement is implemented, provide a labeled Close button, keyboard support, focus management and a visible caption. Enlargement must remain optional.
- Unavailable media displays a useful fallback; unpublished content is removed from public listings.

Acceptance: The first collection is useful without filtering or opening images. Back navigation and dialog closing preserve the visitor's place.

## 9. Recognition page requirements

- Present awards as readable entries with title, date or date precision, issuer, location, explanation and optional photograph.
- Sort deliberately using an editor-controlled order; unknown dates do not become fake dates.
- Group selected press separately, with publication, article title, date where known and outbound link.
- Internally attach source URLs or supporting documents and approved public wording.
- Do not publish the unsubstantiated national Bharat Ratna claim.
- Do not imply endorsement by the United Nations or UK Parliament solely from a ceremony location.
- Public copy should read as a business profile. Research caveats and unresolved evidence stay in the private editorial record unless necessary to accurately describe the claim.

Acceptance: Every visible award has an evidence-backed title and an owner-approved description. Broken supporting links do not remove the readable description.

## 10. Contact page and enquiry flow

### Direct contact — P0

Opening: “Planning an event? Get in touch with Bharat.”

Display large stacked actions in this order:

1. Email Bharat, with the full approved address shown as selectable text and a mail link.
2. Instagram, with the confirmed handle and approved public profile URL.
3. Facebook, with the confirmed page name and approved URL.

Provide a Copy email action with an accessible confirmation. If clipboard permission fails, keep the address selectable. External links must work as ordinary web links without depending on an installed app. Label new-tab behavior if used. Never infer the official profile from a matching name.

### Short form — P0 proposed default

Fields: Name (required); Email (required); Phone (optional); Message (required). This fixed structure avoids ambiguous contact-field validation. Phone-only enquiries can use an approved call action if enabled.

Use visible labels, browser autofill, a multiline message field and plain-language errors. Do not require event date, budget, artist selection, account creation or attachments. Suggested limits: name 120 characters, message 5,000 characters; clearly explain any limit.

### Submission behavior

1. Validate on the server and show field-level errors without clearing entered text.
2. Save the enquiry durably with a unique request identifier.
3. Queue the notification to the confirmed recipient; use the visitor's email as Reply-To, not the sender identity.
4. Show success only after durable acceptance: “Thank you. Your enquiry has been received.”
5. If automatic acknowledgement is enabled, send a short receipt email without an unconfirmed response-time promise.

Submitting state prevents duplicate requests. Repeat submissions with the same request identifier must not create duplicate records. A timeout should offer a safe retry. On failure, retain the message and prominently show the email alternative. Delivery retries must not resend the visitor acknowledgement repeatedly.

Notification failure does not erase a stored enquiry. Alert the designated owner after repeated delivery failure and provide a secure recovery route. Do not claim that an email was delivered merely because the request was accepted.

Abuse protection should start with rate limits and unobtrusive server-side checks. Any challenge must have an accessible alternative. Keep credentials server-side and restrict access to enquiry records. Proposed retention is 90 days, subject to owner approval and implementation in both primary systems and applicable backup policies.

Acceptance: Real test enquiries reach the approved inbox, failure states preserve data, email remains available without the form, and no submitted personal information appears in public URLs or analytics.

## 11. Visual system

The following are proposed tokens, not a finalized brand identity. Designers must validate combinations and responsive behavior.

| Token | Proposal |
| --- | --- |
| Main background | Warm ivory `#FAF7F0` |
| Primary text | Charcoal `#202020` |
| Primary accent | Burgundy `#6E2032` |
| Decorative accent | Muted gold `#A98445`; avoid small gold text on ivory |
| Media background | Near-black `#171717` |
| Body typography | Clear sans-serif; e.g. Source Sans 3 or equivalent |
| Display typography | Readable serif; e.g. Source Serif 4 or equivalent |
| Body size | 20–22 px desktop, approximately 20 px mobile; use scalable units |
| Supporting text | Normally 18 px; reserve smaller type for genuinely secondary metadata |
| Heading scale | Approximately 36–64 px desktop and 32–44 px mobile, adjusted to content |
| Line height | Approximately 1.5–1.65 for body text |
| Reading width | Approximately 50–70 characters per line |
| Controls | Project target: at least 48 × 48 CSS px interactive area |

Use regular or medium body weights, left-aligned paragraphs, strong hierarchy and restrained decoration. Avoid long all-caps labels, ornate scripts for essential text, dense collages, fake lens flares and excessive gold. Design a single-column mobile reading order deliberately rather than simply shrinking desktop cards.

The design should still look complete with fewer approved assets. Component spacing and hierarchy must not depend on filling every slot.

## 12. Motion specification

Motion enhances photographs and transitions while leaving information continuously available.

| Pattern | Proposed behavior | Reduced-motion / failure behavior |
| --- | --- | --- |
| Hero entrance | One opacity/position transition, 250–450 ms, movement no more than 12 px | Render immediately |
| Section entry | Short, once-only image/card reveal, 200–350 ms | Render immediately; never hide essential copy pending script |
| Button feedback | Color/border change, 100–180 ms | Immediate state change |
| Header transition | Small background/shadow change without layout shift | Static appearance |
| Photo dialog | Brief opacity transition | Immediate open/close |
| Optional hero montage | Silent, decorative, short, visible pause/play, no essential information exclusive to it | Poster image; do not autoplay |

No scroll hijacking, automatic scrolling, moving quote ribbons, continuous parallax, flashing effects or navigation that depends on hover. Respect `prefers-reduced-motion`. Avoid motion on constrained connections where a static poster serves the same purpose. Do not replay entrance effects each time a visitor scrolls backward.

If the hero montage runs automatically, it must be muted and inline, have a persistent pause control and fall back cleanly when playback is blocked. It is not necessary for launch and must not delay the hero image or contact action.

## 13. Accessibility and inclusive-use requirements

Target WCAG 2.2 AA across the delivered experience, including the selected media players. The following is a focused checklist, not the full standard: text contrast at least 4.5:1, or 3:1 for qualifying large text; UI contrast where required; text resizing to 200%; reflow at 320 CSS px; keyboard operation; visible, unobscured focus; descriptive labels; text alternatives; accessible status messages; captions for prerecorded speech; audio description where required. Review all applicable criteria before making a conformance claim. [S1]

Additional project requirements: comfortable default text sizes, 48 px control targets, no hover-only information, minimal choices, no required swipe gestures and no essential content hidden in accordions. These are product choices, not a claim that WCAG mandates every listed size.

Provide skip navigation, semantic headings, form labels, logical focus order and an explicit document language. On translated clips, review captions for names and meaning. Written summaries support comprehension but do not replace required synchronized captions or audio description.

Manually test with keyboard, VoiceOver on Safari and at least one Windows screen reader/browser pairing. Run automated checks as a supplement. Test zoom, increased text spacing, narrow viewports, reduced motion and real mobile devices. Include older adults during prototype validation.

## 14. Media sourcing and editorial rules

Use original photo/video files with permission wherever possible. Store originals separately from optimized public renditions. Do not scrape, download around access restrictions, or assume that a public social post grants reuse rights.

YouTube: accept approved video URLs, validate the identifier and display a local poster before loading the player. Configure supported options using official player documentation. Do not promise removal of all platform branding or recommendations. Handle disabled embedding, deleted/private videos and network failure. [S2]

Instagram: for launch, use owner-provided approved originals in the site player or an approved source link. An official embed is acceptable if its current requirements, privacy behavior, captions and performance are validated. A custom live feed is not a launch dependency.

Each asset needs a title, caption, alt text where relevant, named people when confirmed, date precision, usage permission status, attribution requirement, and internal evidence/source reference. A greeting, interview, event clip and testimonial must have distinct content types.

Candidate award names and historical claims from the research dossier require owner review before production use. Avoid presenting a published promotional description as an independently adjudicated title. Do not publish a company founding date or tenure claim merely from a career-start year.

## 15. CMS and editing experience

### Editor landing screen

Show plain-language actions: Add photos; Add a video; Add an award; Add a testimonial; Edit contact details. Hide code, layout controls and SEO configuration from the routine workflow.

### Workflow

1. Choose an action and upload media or paste an approved URL.
2. Enter only the fields needed for that content type.
3. View automatic image sizing and page placement.
4. Preview desktop and mobile presentation.
5. Publish, or save as draft.

Provide draft, published and archived states; preview URLs must not expose drafts to search engines or unauthenticated users without a deliberate protected preview mechanism. Support revision history and restoration of the last published version. Autosave drafts, show save status, and warn before leaving with unsaved changes.

Use selectable featured slots and simple Move up / Move down controls. Dragging may be supplemental but cannot be required. Contact settings are edited once and populate every page. Broken uploads and missing required fields produce clear, specific messages.

### Proposed content model

| Entity | Core fields |
| --- | --- |
| Site settings | Approved names, descriptor, introduction, social URLs, email, optional phone, recipients, footer, default SEO |
| Media asset | ID, file/provider URL, type, title, caption, alt text, aspect ratio, poster, focal point, duration, captions, attribution, rights status, source |
| Event context | Title, location, date/date precision, Bharat's supported role, description, linked assets |
| Service | Title, description, image, display order, publication state |
| Award | Title, issuer, location, date precision, approved description, evidence, image, order, publication state |
| Testimonial | Exact quote, speaker, role, organization, photo/video, approval record, source, publication state |
| Press item | Publication, title, date precision, URL, optional image and summary |
| Homepage selection | References to hero and featured assets, awards and testimonials; no duplicate content records |
| Enquiry | Private ID, timestamp, name, email, optional phone, message, delivery state, retention date |

Enquiries must be separated from public content APIs and exports. Permissions should distinguish site administration, content editing and enquiry access. Use managed authentication and multifactor authentication for privileged accounts where supported; do not invent a custom password system.

## 16. Automation boundaries

### Launch automation

- Responsive image renditions and thumbnails, with manual focal-point correction.
- Reuse of centrally managed contact information.
- Page updates when approved content is published, with a proposed maximum two-minute propagation target.
- Form storage, recipient notification, retry handling and optional acknowledgement.
- Routine backups and alerts for contact delivery failure or site unavailability.

### Later automation

- Authorized social integrations may create draft media entries, subject to provider requirements and costs.
- Automatic caption drafts may assist editors; a human checks names, quotes and claims.
- Future event listings may archive after confirmed local end times, using an explicit event timezone.

Never automatically publish extracted award claims, inferred celebrity endorsements or guessed dates. Automation should reduce formatting and maintenance work while preserving editorial control.

## 17. Technical architecture and operational requirements

Engineering may choose the stack. Prefer server-rendered or statically generated public pages, a managed structured CMS, optimized media delivery, and a small server-side enquiry service. A custom framework or complex application backend is not a product requirement.

Required capabilities:

- Public copy and navigation are present in initial HTML.
- Media assets have responsive sizes and reserved dimensions to prevent layout shifts.
- Below-the-fold images load lazily; the hero image is prioritized.
- Video sources and players are loaded on demand.
- Published changes invalidate relevant caches; previews remain private.
- Forms have server validation, durable storage, delivery retries and recoverable failures.
- Secrets remain server-side; CMS writes and publishing require authenticated permissions.
- User-entered content is sanitized; arbitrary HTML/script embeds are not accepted from routine editors.
- Encrypted transport, restricted data access, backups and a documented restore procedure are in place.
- Staging and production use separate configuration; staging is access-controlled and excluded from indexing.
- Owner-controlled accounts hold the domain, CMS, hosting and email services. The team documents access and recurring costs.

### Performance budgets

Proposed project targets: largest content paint within 2.5 seconds, interaction response within 200 ms and cumulative layout shift at or below 0.1 for representative visits. Use a documented mid-range mobile device/network profile before launch; assess real-user 75th-percentile results after sufficient traffic exists. A lab score is not a substitute for field evidence.

Initial homepage transfer target: under 1.5 MB before visitor-requested media, including the hero image and fonts. Target compressed first-load JavaScript below 200 KB where the selected stack permits. No social feed or background video may be required for the page to look complete. Record any budget exception and its user impact.

## 18. Analytics, SEO and privacy

Track only what supports decisions: contact email clicks, social clicks, form attempts, successful server acceptance, form errors, video starts and meaningful completion events where supported. Include page and content identifier, not names, addresses or message text. Do not claim a video completion if the player cannot report it reliably.

Report contact methods separately. The first month establishes the baseline; prioritize fixing abandonment and usability problems before adding features.

SEO requirements: unique page titles/descriptions, canonical URLs, sitemap, appropriate indexing rules, descriptive image text, social sharing images and meaningful page headings. Structured data must reflect verified visible information; do not imply exclusive artist representation or fabricate ratings.

Publish privacy information consistent with the actual providers and data lifecycle. Document which third parties receive data when video is activated. Implement consent controls where the chosen services and applicable requirements call for them, without blocking access to essential business information. Avoid unnecessary advertising trackers.

## 19. Required content package

| Asset | Launch target | Owner / requirement |
| --- | --- | --- |
| Hero portrait | One strong original plus alternate crop | Family/content owner; approval and credit |
| Celebrity/event photographs | 6–8 homepage selections, optional additional gallery items | Confirm names, context, role and usage |
| Featured videos | Three, preferably concise excerpts or short originals | Approved sources, posters, captions and permissions |
| Service descriptions | Three short blocks | Bharat confirms actual scope |
| Short biography | Approximately 100–150 words | Owner-approved factual copy |
| Awards | Up to four highlights plus approved detailed entries | Evidence and accurate institutional wording |
| Testimonials | Target three | Exact quote and permission to attribute |
| Contact destinations | Email, Instagram and Facebook | Owner confirms current official accounts |
| Brand assets | Logo if available; otherwise approved typographic name treatment | No invented official insignia |
| Privacy and operational details | Recipients, providers, retention and support contact | Owner + engineering |

Do not stretch weak photographs or fabricate social proof to meet an asset count. Missing content must be recorded and resolved through owner-approved substitution or omission.

## 20. Design deliverables and engineering handoff

Design must provide:

1. Sitemap and annotated wireframes for all four primary pages.
2. High-fidelity desktop and mobile designs with actual representative content.
3. Reusable components and tokens: header, navigation, buttons, cards, video facade, award entry, testimonial, form, footer and optional dialog.
4. Motion specifications, reduced-motion variants and static fallbacks.
5. Interaction states: hover, focus, active, loading, empty, error, success, unavailable media and unusually long content.
6. CMS sketches for the five routine actions and preview/publish flow.
7. A clickable prototype covering discovery, video playback, contact and an editorial task.
8. Asset/copy inventory identifying approved items and placeholders.

Engineering must provide a documented implementation plan, CMS schema, environment setup, publishing workflow, enquiry delivery design, monitoring, test evidence, rollback instructions and a short owner guide. Estimates should separate P0 from optional enhancements.

## 21. Acceptance and release checklist

| ID | Release criterion | Evidence / accountable team |
| --- | --- | --- |
| AC-01 | All four main pages work at 320, 390, 768, 1024 and 1440 CSS px without unintended horizontal scrolling | Design + QA screenshots and device checks |
| AC-02 | Main services and contact action are understandable without opening secondary pages | Older-participant prototype sessions |
| AC-03 | Every public social destination and email address is owner-confirmed | Content signoff and live-link check |
| AC-04 | Featured media have readable captions, correct aspect ratios and approved rights | Content checklist |
| AC-05 | Videos play, pause, caption and fail gracefully; other active video pauses | Manual media test |
| AC-06 | Reduced motion disables nonessential movement; no content is stranded invisible | Browser preference and script-failure checks |
| AC-07 | Applicable WCAG 2.2 AA criteria reviewed; keyboard and screen reader tasks pass | Accessibility review with documented findings |
| AC-08 | Form success, validation, timeout, duplicate submission and notification failure are exercised | Engineering integration evidence |
| AC-09 | Actual enquiry reaches the approved recipient; direct contact still works independently | Production smoke test |
| AC-10 | Editor adds, previews, publishes, reorders and restores content without code | Owner/editor acceptance session |
| AC-11 | Performance budgets measured under recorded conditions | Engineering results and approved exceptions |
| AC-12 | Awards and testimonials have evidence and approved wording | Content owner signoff |
| AC-13 | Privacy, access restrictions, backups and retention behavior match implementation | Operational review |
| AC-14 | No placeholders, broken links, unintended indexed previews or public credentials | Release QA |
| AC-15 | Analytics distinguishes clicks from accepted enquiries and excludes personal form contents | Event inspection |

Test current stable Chrome, Safari, Firefox and Edge, plus Safari on iPhone and Chrome on Android. Record tested versions at release. Include at least one older or mid-range mobile device. Do not rely solely on browser emulation.

## 22. Delivery sequence and ownership

| Phase | Work | Exit condition |
| --- | --- | --- |
| 1. Content and setup | Confirm brand/contact, inventory assets, review claims, select architecture | Critical owners and content gaps documented |
| 2. Structure and prototype | Wireframes, visual direction, mobile flow, motion, contact and editor prototypes | Ryan/Bharat approve direction; representative visitors complete key tasks |
| 3. Implementation | Public pages, CMS, media pipeline, enquiry service and analytics | P0 behavior available in protected staging |
| 4. Content and QA | Approved content entry, accessibility, devices, performance and delivery tests | Release checklist satisfied or exceptions explicitly accepted |
| 5. Launch and handoff | Production setup, smoke tests, editor training, ownership transfer and monitoring | Owner can publish; contact paths verified live |
| 6. Review | Review first-month usage, enquiries and maintenance experience | Prioritized improvements based on observed issues |

No delivery dates or costs are assumed. Engineering estimates after reviewing the asset inventory and selecting the platform. Ryan coordinates product/design decisions; Bharat approves business claims and public contact information; design owns visual and interaction specifications; engineering owns delivery and operations; a named content owner maintains the collection.

## 23. Primary risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Too much media creates a slow, crowded site | Curate homepage, load players on request, reserve the archive for secondary browsing |
| Animation makes reading harder | Short effects, visible controls, reduced motion, static core content |
| Photos imply unsupported representation | Specific captions describing supported event roles |
| Missing rights or inaccurate awards | Approval/evidence fields and human publishing review |
| Social platforms change or block embeds | Approved originals where available, local posters and source-link fallbacks |
| Enquiries silently fail | Durable records, notification retries, owner alerting and visible email alternative |
| CMS is too complicated for Bharat | Fixed templates, plain-language actions, observed training task |
| Design looks generic despite polish | Use real portraits, event context, consistent photography and concise personal copy |

## 24. References and design inspiration

These references inform implementation and creative direction; they are not a claim that another site's full experience meets this PRD.

- [S1] W3C, Web Content Accessibility Guidelines (WCAG) 2.2: https://www.w3.org/TR/WCAG22/ — reviewed October 15, 2026. Use the complete standard for the accessibility review.
- [S2] Google, YouTube Embedded Players and Player Parameters: https://developers.google.com/youtube/player_parameters — reviewed October 15, 2026. Recheck supported behavior when integrating.
- W3C, Developing Websites for Older People: https://www.w3.org/WAI/older-users/developing/ — supporting guidance for the older audience.
- W3C, Carousels Tutorial: https://www.w3.org/WAI/tutorials/carousels/ — relevant to motion and pause controls; rotating content is not required here.
- Oberoi Hotels & Resorts: https://www.oberoihotels.com/ — reference for personal service and hospitality positioning.
- Southbank Centre: https://www.southbankcentre.co.uk/ — reference for informative event summaries.
- PBS Great Performances: https://www.pbs.org/wnet/gperf/ — reference for clear performance/video labeling.

Content research supplied in the project conversation is a starting inventory. The content owner must validate the exact public copy and asset permissions before publication. This PRD deliberately does not designate unconfirmed accounts or historical contact details as official.
