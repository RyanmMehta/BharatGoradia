// Enquiry maintenance for the server operator (PRD §10, §16). Run on the server, e.g. every 15 minutes:
//   npm run enquiries:retry              retry due notifications and delete enquiries past retention
//   npm run enquiries:retry -- --list    list enquiries whose notification has not been delivered
//   npm run enquiries:retry -- --show ID print one enquiry in full (secure recovery route)
//   npm run enquiries:retry -- --resend ID  reset a failed enquiry and try delivering it again
// Reads the same environment variables as the server (.env.example).
import { createDepsFromEnv } from '../src/lib/enquiry/runtime.ts';
import { deliver, runMaintenance } from '../src/lib/enquiry/service.ts';

const deps = createDepsFromEnv();
const [flag, id] = process.argv.slice(2);

if (flag === '--list') {
  const rows = deps.store.undelivered();
  if (!rows.length) console.log('All enquiries have been delivered.');
  for (const e of rows)
    console.log(`${e.id}  received ${e.createdAt}  ${e.deliveryState}  attempts=${e.deliveryAttempts}  ${e.lastError ?? ''}`);
} else if (flag === '--show' && id) {
  const e = deps.store.get(id);
  if (!e) {
    console.error('No enquiry with that reference.');
    process.exit(1);
  }
  console.log(`Reference: ${e.id}\nReceived: ${e.createdAt}\nName: ${e.name}\nEmail: ${e.email}\nPhone: ${e.phone || '-'}\n\n${e.message}`);
} else if (flag === '--resend' && id) {
  deps.store.update(id, { deliveryState: 'pending', deliveryAttempts: 0, lastAttemptAt: null, alerted: false });
  await deliver(id, deps);
  console.log(`Delivery state: ${deps.store.get(id)?.deliveryState ?? 'not found'}`);
} else {
  const result = await runMaintenance(deps);
  console.log(`Retried ${result.retried}, purged ${result.purged}, permanently failed ${result.failed}.`);
  if (result.failed > 0) process.exitCode = 2;
}
