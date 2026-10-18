import type { APIRoute } from 'astro';
import { background, clientKey, enquiryDeps } from '../../lib/enquiry/runtime.ts';
import { FORM_ERRORS, submitEnquiry } from '../../lib/enquiry/service.ts';

export const prerender = false;

const MAX_BODY_BYTES = 32 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

// JSON endpoint used by the enhanced contact form. The no-JavaScript form posts to /contact/send.
export const POST: APIRoute = async (context) => {
  const { request } = context;
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return json({ ok: false, formError: FORM_ERRORS.badRequest }, 413);

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ ok: false, formError: FORM_ERRORS.badRequest }, 413);
    raw = JSON.parse(text);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not an object');
  } catch {
    return json({ ok: false, formError: FORM_ERRORS.badRequest }, 400);
  }

  let result;
  try {
    result = await submitEnquiry(raw, clientKey(request, () => context.clientAddress), enquiryDeps(), background(context.locals));
  } catch (err) {
    console.error('[enquiry] unexpected failure', err);
    return json({ ok: false, formError: FORM_ERRORS.unavailable }, 500);
  }

  if (result.ok) return json({ ok: true, id: result.id });
  if (result.status === 422) return json({ ok: false, errors: result.errors }, 422);
  return json({ ok: false, formError: result.formError }, result.status);
};

export const GET: APIRoute = () => json({ ok: false }, 405);
