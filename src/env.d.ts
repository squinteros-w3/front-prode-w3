/// <reference types="astro/client" />

import type { AppUser } from './lib/types';

declare global {
  namespace App {
    interface Locals {
      user: AppUser | null;
      token: string | null;
    }
  }
}

interface ImportMetaEnv {
  readonly BACKEND_API_URL: string;
  readonly PUBLIC_BACKEND_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
