import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Content model from PRD §15. Files are written by the editor (keystatic.config.ts) or by hand.
// Every public-facing record carries:
//   status       draft | published | archived. Only "published" ever renders.
//   placeholder  true for prototype stand-ins. Withheld when SITE_MODE=launch, and
//                `npm run check:content` fails a launch build that still references one.
// Fields named `evidence` / `approval` are private editorial records. Page templates must never
// render them. (If this repository is public, keep sensitive notes elsewhere.)

const status = z.enum(['draft', 'published', 'archived']).default('draft');

// Dates keep their real precision: "2019", "2019-05" or "2019-05-12". Never invent a day or month.
const partialDate = z
  .string()
  .regex(/^(\d{4}(-\d{2}(-\d{2})?)?)?$/, 'Use YYYY, YYYY-MM or YYYY-MM-DD')
  .nullish()
  .transform((v) => v ?? '');

// Optional text from the editor may arrive as "" or null.
const optionalText = z
  .string()
  .nullish()
  .transform((v) => v ?? '');
const optionalUrl = z
  .union([z.url(), z.literal('')])
  .nullish()
  .transform((v) => v || undefined);
// https://www.youtube.com/watch?v=ID, https://youtu.be/ID, /shorts/ID, /embed/ID, /live/ID or a bare ID.
function youtubeIdFrom(value: string) {
  const v = value.trim();
  const match = v.match(/(?:[?&]v=|youtu\.be\/|\/(?:shorts|embed|live)\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : v;
}
const rights = z.enum(['approved', 'pending', 'not-approved']).default('pending');
const order = z.number().nullish().transform((v) => v ?? 100);

const photos = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/photos' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      caption: z.string().min(1),
      alt: z.string().min(1, 'Describe the photo for people who cannot see it'),
      people: z.array(z.string()).default([]),
      event: optionalText,
      // Bharat's supported role in the pictured event. Leave empty rather than guess.
      bharatRole: optionalText,
      date: partialDate,
      image: image(),
      // CSS object-position chosen by the editor so automated crops never cut faces.
      focalPoint: z.string().default('50% 30%'),
      sourceUrl: optionalUrl,
      attribution: optionalText,
      rights,
      evidence: optionalText,
      order,
      status,
      placeholder: z.boolean().default(false),
    }),
});

const videos = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/videos' }),
  schema: ({ image }) =>
    z
      .object({
        // Distinct content types (PRD §14): a greeting is not a testimonial.
        videoType: z.enum(['interview', 'event', 'testimonial', 'greeting']),
        title: z.string().min(1),
        description: z.string().min(1),
        people: z.array(z.string()).default([]),
        event: optionalText,
        date: partialDate,
        // Optional for YouTube: the card falls back to YouTube's own thumbnail.
        poster: image().nullish(),
        provider: z.enum(['youtube', 'file', 'link']),
        // The editor accepts a full YouTube link or a bare ID; only the ID is kept.
        youtubeId: z
          .string()
          .nullish()
          .transform((v) => (v ? youtubeIdFrom(v) : undefined))
          .refine((v) => v === undefined || /^[A-Za-z0-9_-]{11}$/.test(v), 'Paste a YouTube link or an 11-character video ID'),
        fileUrl: optionalText,
        captionsUrl: optionalText,
        duration: z
          .string()
          .regex(/^((\d+:)?\d{1,2}:\d{2})?$/, 'Use m:ss or h:mm:ss')
          .nullish()
          .transform((v) => v ?? ''),
        orientation: z.enum(['landscape', 'portrait']).default('landscape'),
        sourceUrl: optionalUrl,
        sourceLabel: optionalText,
        attribution: optionalText,
        rights,
        evidence: optionalText,
        order,
        status,
        placeholder: z.boolean().default(false),
      })
      .superRefine((v, ctx) => {
        if (v.provider === 'youtube' && !v.youtubeId)
          ctx.addIssue({ code: 'custom', path: ['youtubeId'], message: 'A YouTube video needs its video ID' });
        if (v.provider !== 'youtube' && !v.poster)
          ctx.addIssue({ code: 'custom', path: ['poster'], message: 'Add a cover image for videos that are not on YouTube' });
        if (v.provider === 'file' && !v.fileUrl)
          ctx.addIssue({ code: 'custom', path: ['fileUrl'], message: 'A video file needs its file URL' });
      }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/services' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    order,
    status,
    placeholder: z.boolean().default(false),
  }),
});

const awards = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/awards' }),
  schema: ({ image }) =>
    z.object({
      // "award" is a conferred award; "honour" is an honorary description or title.
      kind: z.enum(['award', 'honour']).default('award'),
      title: z.string().min(1),
      issuer: optionalText,
      location: optionalText,
      date: partialDate,
      description: z.string().min(1),
      image: image().nullish(),
      imageAlt: optionalText,
      link: optionalUrl,
      linkLabel: optionalText,
      evidence: z.object({
        sources: z.array(z.string()).default([]),
        notes: optionalText,
        wordingApproved: z.boolean().default(false),
      }),
      order,
      status,
      placeholder: z.boolean().default(false),
    }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/testimonials' }),
  schema: ({ image }) =>
    z.object({
      kind: z.enum(['testimonial', 'greeting']).default('testimonial'),
      quote: z.string().min(1),
      speaker: z.string().min(1),
      role: optionalText,
      organization: optionalText,
      photo: image().nullish(),
      video: reference('videos').nullish(),
      approval: z.object({
        approved: z.boolean().default(false),
        date: partialDate,
        record: optionalText,
      }),
      order,
      status,
      placeholder: z.boolean().default(false),
    }),
});

const press = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/press' }),
  schema: z.object({
    publication: z.string().min(1),
    title: z.string().min(1),
    date: partialDate,
    url: optionalUrl,
    summary: optionalText,
    order,
    status,
    placeholder: z.boolean().default(false),
  }),
});

export const collections = { photos, videos, services, awards, testimonials, press };
