import { collection, config, fields, singleton } from '@keystatic/core';

// Private content editor (PRD §15), served at /keystatic.
// Development: edits are written straight to the files in this repository.
// Production: set KEYSTATIC_GITHUB_REPO (owner/name) and the GitHub app variables in .env.example.
// Editors then sign in with GitHub, and only people with write access to the repository can publish.
const githubRepo = import.meta.env.KEYSTATIC_GITHUB_REPO as `${string}/${string}` | undefined;

const statusField = fields.select({
  label: 'Visibility',
  description: 'Only "Published" items appear on the website. "Archived" hides an item without deleting it.',
  options: [
    { label: 'Draft (not on the website)', value: 'draft' },
    { label: 'Published', value: 'published' },
    { label: 'Archived', value: 'archived' },
  ],
  defaultValue: 'draft',
});

const placeholderField = fields.checkbox({
  label: 'This is a placeholder',
  description: 'Placeholders appear only in the prototype and are withheld from the public website.',
  defaultValue: false,
});

const orderField = fields.integer({
  label: 'Display order',
  description: 'Lower numbers appear first, for example 10, 20, 30.',
  defaultValue: 100,
});

const dateField = (label = 'Date') =>
  fields.text({
    label,
    description: 'Only as precise as you know: a year (2019), a month (2019-05) or a full date (2019-05-12). Leave empty if unknown.',
    validation: { pattern: { regex: /^(\d{4}(-\d{2}(-\d{2})?)?)?$/, message: 'Use 2019, 2019-05 or 2019-05-12' } },
  });

const rightsField = fields.select({
  label: 'Permission to use',
  description: 'Only items with approved permission can be published.',
  options: [
    { label: 'Pending: permission not yet confirmed', value: 'pending' },
    { label: 'Approved for the website', value: 'approved' },
    { label: 'Not approved', value: 'not-approved' },
  ],
  defaultValue: 'pending',
});

const evidenceField = fields.text({
  label: 'Private notes and source (not shown on the website)',
  description: 'Where this came from and who approved it.',
  multiline: true,
});

export default config({
  storage: githubRepo ? { kind: 'github', repo: githubRepo } : { kind: 'local' },
  ui: {
    brand: { name: 'Bharat Goradia website' },
    navigation: {
      'Routine updates': ['photos', 'videos', 'awards', 'testimonials', 'settings'],
      'Page set-up': ['homepage', 'services', 'press'],
    },
  },
  singletons: {
    settings: singleton({
      label: 'Edit contact details',
      path: 'src/data/settings',
      format: { data: 'json' },
      schema: {
        personName: fields.text({ label: 'Name', validation: { isRequired: true } }),
        businessName: fields.text({ label: 'Business name' }),
        descriptor: fields.text({ label: 'What Bharat does (one line)', validation: { isRequired: true } }),
        introduction: fields.text({ label: 'Short introduction (one sentence)', multiline: true, validation: { isRequired: true } }),
        biography: fields.text({ label: 'Short biography (100–150 words)', multiline: true }),
        email: fields.text({ label: 'Email address', validation: { isRequired: true } }),
        instagram: fields.object(
          {
            handle: fields.text({ label: 'Instagram handle, e.g. @name' }),
            url: fields.url({ label: 'Instagram profile link', validation: { isRequired: true } }),
          },
          { label: 'Instagram' },
        ),
        facebook: fields.object(
          {
            name: fields.text({ label: 'Facebook page name' }),
            url: fields.url({ label: 'Facebook page link', validation: { isRequired: true } }),
          },
          { label: 'Facebook' },
        ),
        phone: fields.object(
          {
            show: fields.checkbox({ label: 'Show a telephone number on the website', defaultValue: false }),
            display: fields.text({ label: 'Number as it should appear' }),
            tel: fields.text({ label: 'Number for dialling, e.g. +441234567890' }),
          },
          { label: 'Telephone (optional)' },
        ),
        confirmed: fields.object(
          {
            names: fields.checkbox({ label: 'Name and business name confirmed' }),
            descriptor: fields.checkbox({ label: 'One-line description confirmed' }),
            introduction: fields.checkbox({ label: 'Introduction confirmed' }),
            biography: fields.checkbox({ label: 'Biography confirmed' }),
            email: fields.checkbox({ label: 'Email address confirmed as official' }),
            instagram: fields.checkbox({ label: 'Instagram account confirmed as official' }),
            facebook: fields.checkbox({ label: 'Facebook page confirmed as official' }),
          },
          { label: 'Owner confirmation (needed before launch)' },
        ),
        seo: fields.object(
          { description: fields.text({ label: 'Search result description', multiline: true }) },
          { label: 'Search engines' },
        ),
        footerNote: fields.text({ label: 'Footer note (optional)' }),
      },
    }),
    homepage: singleton({
      label: 'Homepage selections',
      path: 'src/data/homepage',
      format: { data: 'json' },
      schema: {
        hero: fields.object(
          {
            image: fields.image({
              label: 'Main portrait',
              directory: 'src/assets/hero',
              publicPath: '/src/assets/hero/',
              validation: { isRequired: true },
            }),
            alt: fields.text({ label: 'Describe the portrait', validation: { isRequired: true } }),
            focalPoint: fields.text({
              label: 'Keep this point in view when cropping',
              description: 'Horizontal and vertical position, e.g. "50% 25%" keeps the upper middle (the face) in view.',
              defaultValue: '50% 25%',
            }),
            placeholder: placeholderField,
          },
          { label: 'Opening portrait' },
        ),
        introVideo: fields.relationship({ label: 'Introduction video (optional)', collection: 'videos' }),
        artistPhotos: fields.array(fields.relationship({ label: 'Photo', collection: 'photos', validation: { isRequired: true } }), {
          label: 'With the artists: photos (6, up to 8)',
          validation: { length: { max: 8 } },
          itemLabel: (p) => p.value ?? 'Choose a photo',
        }),
        featuredVideos: fields.array(fields.relationship({ label: 'Video', collection: 'videos', validation: { isRequired: true } }), {
          label: 'Featured videos (3)',
          validation: { length: { max: 3 } },
          itemLabel: (p) => p.value ?? 'Choose a video',
        }),
        awards: fields.array(fields.relationship({ label: 'Award', collection: 'awards', validation: { isRequired: true } }), {
          label: 'Awards preview (up to 4)',
          validation: { length: { max: 4 } },
          itemLabel: (p) => p.value ?? 'Choose an award',
        }),
        testimonials: fields.array(
          fields.relationship({ label: 'Testimonial', collection: 'testimonials', validation: { isRequired: true } }),
          { label: 'Testimonials', itemLabel: (p) => p.value ?? 'Choose a testimonial' },
        ),
      },
    }),
  },
  collections: {
    photos: collection({
      label: 'Add photos',
      path: 'src/content/photos/*',
      slugField: 'title',
      format: { data: 'json' },
      columns: ['title', 'status'],
      schema: {
        title: fields.slug({ name: { label: 'Short title (for your reference)' } }),
        image: fields.image({
          label: 'Photo',
          directory: 'src/assets/photos',
          publicPath: '../../assets/photos/',
          validation: { isRequired: true },
        }),
        people: fields.array(fields.text({ label: 'Name' }), {
          label: 'People in the photo (confirmed names only)',
          itemLabel: (p) => p.value || 'Name',
        }),
        caption: fields.text({ label: 'Caption shown under the photo', multiline: true, validation: { isRequired: true } }),
        alt: fields.text({
          label: 'Describe the photo for people who cannot see it',
          multiline: true,
          validation: { isRequired: true },
        }),
        event: fields.text({ label: 'Event or occasion' }),
        bharatRole: fields.text({
          label: "Bharat's role at this event",
          description: 'Only if confirmed. A photo alone should not suggest a booking or endorsement.',
        }),
        date: dateField(),
        focalPoint: fields.text({
          label: 'Keep this point in view when cropping',
          description: 'e.g. "50% 25%" keeps faces near the top in view.',
          defaultValue: '50% 30%',
        }),
        attribution: fields.text({ label: 'Photo credit (if required)' }),
        sourceUrl: fields.url({ label: 'Original source link (optional)' }),
        rights: rightsField,
        evidence: evidenceField,
        order: orderField,
        status: statusField,
        placeholder: placeholderField,
      },
    }),
    videos: collection({
      label: 'Add a video',
      path: 'src/content/videos/*',
      slugField: 'title',
      format: { data: 'json' },
      columns: ['title', 'status'],
      schema: {
        title: fields.slug({ name: { label: 'Video title' } }),
        videoType: fields.select({
          label: 'Type of video',
          options: [
            { label: 'Interview or introduction', value: 'interview' },
            { label: 'Event highlight', value: 'event' },
            { label: 'Testimonial', value: 'testimonial' },
            { label: 'Greeting from an artist', value: 'greeting' },
          ],
          defaultValue: 'event',
        }),
        description: fields.text({ label: 'Short description', multiline: true, validation: { isRequired: true } }),
        provider: fields.select({
          label: 'Where the video is',
          options: [
            { label: 'YouTube', value: 'youtube' },
            { label: 'A video file (uploaded original)', value: 'file' },
            { label: 'Another website (link only)', value: 'link' },
          ],
          defaultValue: 'youtube',
        }),
        youtubeId: fields.text({
          label: 'YouTube video ID',
          description: 'The 11 characters after "v=" in the YouTube link, e.g. dQw4w9WgXcQ.',
          validation: { pattern: { regex: /^([A-Za-z0-9_-]{11})?$/, message: 'A YouTube video ID is 11 characters' } },
        }),
        fileUrl: fields.text({ label: 'Video file address (for uploaded originals)' }),
        captionsUrl: fields.text({ label: 'Captions file address (.vtt)' }),
        sourceUrl: fields.url({ label: 'Link to the original (Instagram, YouTube, etc.)' }),
        sourceLabel: fields.text({ label: 'Link text, e.g. "Watch on Instagram"' }),
        poster: fields.image({
          label: 'Cover image',
          directory: 'src/assets/videos',
          publicPath: '../../assets/videos/',
          validation: { isRequired: true },
        }),
        duration: fields.text({
          label: 'Length',
          description: 'Minutes and seconds, e.g. 2:30',
          validation: { pattern: { regex: /^(\d+:)?\d{1,2}:\d{2}$/, message: 'Use minutes:seconds, e.g. 2:30' } },
        }),
        orientation: fields.select({
          label: 'Shape',
          options: [
            { label: 'Landscape (wide)', value: 'landscape' },
            { label: 'Portrait (tall, e.g. Instagram Reels)', value: 'portrait' },
          ],
          defaultValue: 'landscape',
        }),
        people: fields.array(fields.text({ label: 'Name' }), { label: 'People in the video', itemLabel: (p) => p.value || 'Name' }),
        event: fields.text({ label: 'Event or occasion' }),
        date: dateField(),
        attribution: fields.text({ label: 'Credit (if required)' }),
        rights: rightsField,
        evidence: evidenceField,
        order: orderField,
        status: statusField,
        placeholder: placeholderField,
      },
    }),
    awards: collection({
      label: 'Add an award',
      path: 'src/content/awards/*',
      slugField: 'title',
      format: { data: 'json' },
      columns: ['title', 'status'],
      schema: {
        title: fields.slug({ name: { label: 'Award title (exact approved wording)' } }),
        kind: fields.select({
          label: 'Type',
          options: [
            { label: 'Award', value: 'award' },
            { label: 'Honour or honorary title', value: 'honour' },
          ],
          defaultValue: 'award',
        }),
        issuer: fields.text({ label: 'Awarded by', description: 'The organisation that gave the award, not the venue.' }),
        location: fields.text({ label: 'Where it was presented' }),
        date: dateField('Date awarded'),
        description: fields.text({ label: 'One or two sentences of context', multiline: true, validation: { isRequired: true } }),
        image: fields.image({ label: 'Photo (optional)', directory: 'src/assets/awards', publicPath: '../../assets/awards/' }),
        imageAlt: fields.text({ label: 'Describe the photo' }),
        link: fields.url({ label: 'Supporting link shown on the website (optional)' }),
        linkLabel: fields.text({ label: 'Link text' }),
        evidence: fields.object(
          {
            sources: fields.array(fields.text({ label: 'Source link or document' }), {
              label: 'Evidence (required to publish)',
              itemLabel: (p) => p.value || 'Source',
            }),
            notes: fields.text({ label: 'Notes', multiline: true }),
            wordingApproved: fields.checkbox({ label: 'Bharat has approved this wording' }),
          },
          { label: 'Private evidence record (not shown on the website)' },
        ),
        order: orderField,
        status: statusField,
        placeholder: placeholderField,
      },
    }),
    testimonials: collection({
      label: 'Add a testimonial',
      path: 'src/content/testimonials/*',
      slugField: 'speaker',
      format: { data: 'json' },
      columns: ['speaker', 'status'],
      schema: {
        speaker: fields.slug({ name: { label: 'Name of the person quoted' } }),
        kind: fields.select({
          label: 'Type',
          options: [
            { label: 'Testimonial (about working with Bharat)', value: 'testimonial' },
            { label: 'Greeting (e.g. from an artist)', value: 'greeting' },
          ],
          defaultValue: 'testimonial',
        }),
        quote: fields.text({ label: 'Exact approved quote', multiline: true, validation: { isRequired: true } }),
        role: fields.text({ label: 'Their role' }),
        organization: fields.text({ label: 'Their organisation' }),
        photo: fields.image({ label: 'Photo (optional)', directory: 'src/assets/testimonials', publicPath: '../../assets/testimonials/' }),
        video: fields.relationship({ label: 'Related video (optional)', collection: 'videos' }),
        approval: fields.object(
          {
            approved: fields.checkbox({ label: 'The person has approved this quote and use of their name' }),
            date: dateField('Date approved'),
            record: fields.text({ label: 'How approval was given (e.g. email of 3 May)', multiline: true }),
          },
          { label: 'Approval record (not shown on the website)' },
        ),
        order: orderField,
        status: statusField,
        placeholder: placeholderField,
      },
    }),
    services: collection({
      label: 'Services',
      path: 'src/content/services/*',
      slugField: 'title',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Service name' } }),
        description: fields.text({ label: 'Short description', multiline: true, validation: { isRequired: true } }),
        order: orderField,
        status: statusField,
        placeholder: placeholderField,
      },
    }),
    press: collection({
      label: 'Press coverage',
      path: 'src/content/press/*',
      slugField: 'title',
      format: { data: 'json' },
      schema: {
        title: fields.slug({ name: { label: 'Article title' } }),
        publication: fields.text({ label: 'Publication', validation: { isRequired: true } }),
        date: dateField(),
        url: fields.url({ label: 'Link to the article', validation: { isRequired: true } }),
        summary: fields.text({ label: 'One-sentence summary', multiline: true }),
        order: orderField,
        status: statusField,
        placeholder: placeholderField,
      },
    }),
  },
});
