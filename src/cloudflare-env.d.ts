// Minimal type for the Workers runtime module used by src/worker.ts (only the bindings this site reads).
declare module 'cloudflare:workers' {
  export const env: { DB?: unknown } & Record<string, unknown>;
}
