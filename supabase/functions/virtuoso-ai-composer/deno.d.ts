// Deno runtime type declarations for Supabase Edge Function environment
// This file provides type definitions for Deno globals that are available in the Supabase Edge Runtime

declare global {
  namespace Deno {
    export function serve(handler: (request: Request) => Response | Promise<Response>): void;
    export namespace env {
      export function get(key: string): string | undefined;
    }
  }
}

export {};
