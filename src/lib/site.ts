import { getCollection, getEntries, type CollectionEntry } from 'astro:content';
import type { ImageMetadata } from 'astro';
import { z } from 'astro/zod';
import settingsJson from '../data/settings.json';
import homepageJson from '../data/homepage.json';

export type SiteMode = 'prototype' | 'launch';

export const siteMode: SiteMode =
  (import.meta.env.SITE_MODE ?? process.env.SITE_MODE) === 'launch' ? 'launch' : 'prototype';
export const isPrototype = siteMode === 'prototype';

// The editor omits empty optional fields, so everything optional has a default.
const text = z.string().nullish().transform((v) => v ?? '');
const settingsSchema = z.object({
  personName: z.string().min(1),
  businessName: text,
  descriptor: z.string().min(1),
  introduction: z.string().min(1),
  biography: text,
  email: z.email(),
  instagram: z.object({ handle: text, url: z.url() }),
  facebook: z.object({ name: text, url: z.url() }),
  phone: z.object({ show: z.boolean().default(false), display: text, tel: text }).default({ show: false, display: '', tel: '' }),
  confirmed: z.record(z.string(), z.boolean()).default({}),
  seo: z.object({ description: text }).default({ description: '' }),
  footerNote: text,
});

const homepageSchema = z.object({
  hero: z.object({
    image: z.string(),
    alt: z.string(),
    focalPoint: z.string().nullish().transform((v) => v || '50% 30%'),
    placeholder: z.boolean().default(false),
  }),
  introVideo: z.string().nullish().transform((v) => v ?? ''),
  artistPhotos: z.array(z.string()).max(8).default([]),
  featuredVideos: z.array(z.string()).max(3).default([]),
  awards: z.array(z.string()).max(4).default([]),
  testimonials: z.array(z.string()).default([]),
});

export const settings = settingsSchema.parse(settingsJson);
export const homepage = homepageSchema.parse(homepageJson);

/** True when an owner has not yet confirmed this settings field (shown as a placeholder in prototypes). */
export const unconfirmed = (key: string) => settings.confirmed[key] !== true;

export type PublicCollection = 'photos' | 'videos' | 'services' | 'awards' | 'testimonials' | 'press';
type Publishable = CollectionEntry<PublicCollection>;

/**
 * The single publication rule for every public listing.
 * Placeholders appear only in prototype builds; real content must be published and,
 * where the content type needs it, carry approval (rights, award wording, testimonial consent).
 */
export function isPublic(entry: Publishable): boolean {
  const data = entry.data;
  if (data.status !== 'published') return false;
  if (data.placeholder) return isPrototype;
  switch (entry.collection) {
    case 'photos':
    case 'videos':
      return entry.data.rights === 'approved';
    case 'awards':
      return entry.data.evidence.wordingApproved && entry.data.evidence.sources.length > 0;
    case 'testimonials':
      return entry.data.approval.approved;
    default:
      return true;
  }
}

const byOrder = <T extends { data: { order: number } }>(a: T, b: T) => a.data.order - b.data.order;

export async function publicCollection<C extends PublicCollection>(
  name: C,
): Promise<CollectionEntry<C>[]> {
  const all = (await getCollection(name)) as CollectionEntry<C>[];
  return all.filter((e) => isPublic(e as Publishable)).sort(byOrder);
}

/** Resolve homepage selections, keeping editor order and silently dropping unpublished items. */
export async function selected<C extends PublicCollection>(
  name: C,
  ids: string[],
): Promise<CollectionEntry<C>[]> {
  const entries = (await getEntries(ids.map((id) => ({ collection: name, id })) as never)) as (
    | CollectionEntry<C>
    | undefined
  )[];
  return entries.filter((e): e is CollectionEntry<C> => Boolean(e) && isPublic(e as Publishable));
}

const assetImages = import.meta.glob<ImageMetadata>('/src/assets/**/*.{jpg,jpeg,png,webp,avif,svg}', {
  eager: true,
  import: 'default',
});

export function heroImage(): ImageMetadata | undefined {
  if (homepage.hero.placeholder && !isPrototype) return undefined;
  const image = assetImages[homepage.hero.image];
  if (!image) throw new Error(`Homepage portrait not found: ${homepage.hero.image}`);
  return image;
}

/** Human-readable date that respects the stored precision ("2019", "May 2019", "12 May 2019"). */
export function formatPartialDate(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  if (!m) return String(y);
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
  return d ? `${d} ${month} ${y}` : `${month} ${y}`;
}

export const navItems = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery & Videos' },
  { href: '/recognition', label: 'Recognition' },
] as const;
