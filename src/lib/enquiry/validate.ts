// Server-side validation for the enquiry form (PRD §10). Messages are plain language.

export const LIMITS = { name: 120, email: 254, phone: 40, message: 5000 } as const;

export type EnquiryField = 'name' | 'email' | 'phone' | 'message';

export interface EnquiryInput {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export type FieldErrors = Partial<Record<EnquiryField, string>>;

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE = /^[+()\d\s.\-/]*$/;

const clean = (v: unknown) =>
  typeof v === 'string'
    ? v
        .replace(/\r\n?/g, '\n')
        // drop control characters other than newline and tab
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
    : '';

export function normalise(raw: Record<string, unknown>): EnquiryInput {
  return {
    name: clean(raw.name).replace(/\s+/g, ' '),
    email: clean(raw.email).toLowerCase(),
    phone: clean(raw.phone),
    message: clean(raw.message),
  };
}

export function validate(input: EnquiryInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name) errors.name = 'Please enter your name.';
  else if (input.name.length > LIMITS.name)
    errors.name = `Please shorten your name to ${LIMITS.name} characters or fewer.`;

  if (!input.email) errors.email = 'Please enter your email address so Bharat can reply.';
  else if (input.email.length > LIMITS.email || !EMAIL.test(input.email))
    errors.email = 'Please check your email address. It should look like name@example.com.';

  if (input.phone) {
    const digits = input.phone.replace(/\D/g, '').length;
    if (input.phone.length > LIMITS.phone || !PHONE.test(input.phone) || digits < 6)
      errors.phone = 'Please check the phone number, or leave it empty. It is optional.';
  }

  if (!input.message) errors.message = 'Please write a short message about your event or question.';
  else if (input.message.length > LIMITS.message)
    errors.message = `Your message is ${input.message.length.toLocaleString('en-GB')} characters. Please shorten it to ${LIMITS.message.toLocaleString('en-GB')} characters or fewer.`;

  return errors;
}

/** Request identifiers come from the visitor's browser; accept only a safe, bounded format. */
export function validRequestId(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Za-z0-9-]{16,64}$/.test(v);
}
