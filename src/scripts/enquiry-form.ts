// Enhanced enquiry form (PRD §10). Without JavaScript the form posts to /contact/send and works the same.
//  - One request identifier per message, kept across retries, so a retry never creates a duplicate.
//  - The Send button is disabled while sending to prevent double submission.
//  - Typed text is never cleared on error, timeout or failure.
//  - Success is shown only after the server confirms the enquiry was stored.
import { track } from './analytics';
import { showerPetals } from './petals';

const TIMEOUT_MS = 15_000;
const FIELDS = ['name', 'email', 'phone', 'message'] as const;
type Field = (typeof FIELDS)[number];

function newRequestId() {
  return crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function initEnquiryForm(): void {
  document.querySelectorAll<HTMLElement>('[data-enquiry]').forEach((root) => {
    const form = root.querySelector<HTMLFormElement>('[data-enquiry-form]');
    if (!form || form.dataset.enhanced) return;
    form.dataset.enhanced = 'true';

    const submit = form.querySelector<HTMLButtonElement>('[data-submit]')!;
    const status = form.querySelector<HTMLElement>('[data-form-status]')!;
    const summary = form.querySelector<HTMLElement>('[data-error-summary]')!;
    const requestIdInput = form.querySelector<HTMLInputElement>('[data-request-id]')!;
    const success = root.querySelector<HTMLElement>('[data-success]')!;
    const message = form.querySelector<HTMLTextAreaElement>('textarea[name="message"]')!;
    const counter = form.querySelector<HTMLElement>('[data-char-count]')!;
    const email = (document.querySelector('[data-email-text]')?.textContent ?? '').trim();
    const limit = 5000;
    let sending = false;
    let attempted = false;

    // A new message gets a new id; editing after a failed attempt keeps the same id so a retry is safe.
    requestIdInput.value = newRequestId();

    const updateCounter = () => {
      const n = message.value.length;
      counter.textContent =
        n > limit
          ? `${(n - limit).toLocaleString('en-GB')} characters over the limit.`
          : n > limit - 500
            ? `${(limit - n).toLocaleString('en-GB')} characters remaining.`
            : '';
    };
    message.addEventListener('input', updateCounter);

    function setFieldError(field: Field, text: string) {
      const input = form!.elements.namedItem(field) as HTMLInputElement | HTMLTextAreaElement | null;
      const errorEl = form!.querySelector<HTMLElement>(`[data-error-for="${field}"]`);
      if (!input || !errorEl) return;
      errorEl.textContent = text;
      input.closest('.field')?.classList.toggle('has-error', Boolean(text));
      if (text) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }

    function showSummary(heading: string, items: { field?: Field; text: string }[], extraHtml?: Node) {
      summary.replaceChildren();
      const h = document.createElement('h3');
      h.textContent = heading;
      summary.append(h);
      if (items.length) {
        const ul = document.createElement('ul');
        for (const item of items) {
          const li = document.createElement('li');
          if (item.field) {
            const a = document.createElement('a');
            a.href = `#enquiry-${item.field}`;
            a.textContent = item.text;
            li.append(a);
          } else li.textContent = item.text;
          ul.append(li);
        }
        summary.append(ul);
      }
      if (extraHtml) summary.append(extraHtml);
      summary.hidden = false;
      summary.focus();
    }

    function emailFallback(): Node {
      const p = document.createElement('p');
      if (!email) return p;
      p.append('You can also email Bharat directly: ');
      const a = document.createElement('a');
      a.href = `mailto:${email}`;
      a.textContent = email;
      a.dataset.track = 'contact_email_click';
      a.dataset.trackId = 'form-fallback';
      p.append(a);
      return p;
    }

    function clientCheck(): { field: Field; text: string }[] {
      const errs: { field: Field; text: string }[] = [];
      const val = (f: Field) => ((form!.elements.namedItem(f) as HTMLInputElement).value ?? '').trim();
      if (!val('name')) errs.push({ field: 'name', text: 'Please enter your name.' });
      const em = val('email');
      if (!em) errs.push({ field: 'email', text: 'Please enter your email address so Bharat can reply.' });
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em))
        errs.push({ field: 'email', text: 'Please check your email address. It should look like name@example.com.' });
      if (!val('message')) errs.push({ field: 'message', text: 'Please write a short message about your event or question.' });
      else if (val('message').length > limit)
        errs.push({ field: 'message', text: `Please shorten your message to ${limit.toLocaleString('en-GB')} characters or fewer.` });
      return errs;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;

      FIELDS.forEach((f) => setFieldError(f, ''));
      summary.hidden = true;
      status.textContent = '';

      const quick = clientCheck();
      if (quick.length) {
        quick.forEach((q) => setFieldError(q.field, q.text));
        showSummary('Please check the form', quick);
        track('form_error', { fields: quick.map((q) => q.field).join(',') });
        return;
      }

      if (!attempted) track('form_attempt');
      attempted = true;
      sending = true;
      submit.disabled = true;
      submit.textContent = 'Sending…';
      status.textContent = 'Sending your message…';

      const body = Object.fromEntries(new FormData(form)) as Record<string, string>;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        const res = await fetch('/api/enquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          id?: string;
          errors?: Partial<Record<Field, string>>;
          formError?: string;
        };

        if (res.ok && data.ok) {
          success.querySelector('[data-success-id]')!.textContent = data.id ?? '';
          form.hidden = true;
          success.hidden = false;
          success.focus();
          showerPetals();
          track('form_accepted');
          return;
        }

        if (res.status === 422 && data.errors) {
          const items = (Object.entries(data.errors) as [Field, string][]).map(([field, text]) => {
            setFieldError(field, text);
            return { field, text };
          });
          showSummary('Please check the form', items);
          track('form_error', { fields: items.map((i) => i.field).join(',') });
          return;
        }

        showSummary(
          'Your message was not sent',
          [{ text: data.formError ?? 'Sorry, something went wrong. Your message is still here. Please try again.' }],
          emailFallback(),
        );
        track('form_error', { fields: `server-${res.status}` });
      } catch {
        // Timeout or network failure: the server may or may not have stored it. Retrying is safe
        // because the same request id is reused, so it cannot create a duplicate.
        showSummary(
          'We could not confirm your message was received',
          [{ text: 'Your message is still here. Please check your connection and press Send message again.' }],
          emailFallback(),
        );
        track('form_error', { fields: 'network' });
      } finally {
        clearTimeout(timer);
        sending = false;
        submit.disabled = false;
        submit.textContent = 'Send message';
        if (!form.hidden) status.textContent = '';
      }
    });
  });
}
