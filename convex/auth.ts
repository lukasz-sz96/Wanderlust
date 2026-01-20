import { betterAuth } from 'better-auth/minimal';
import {  createClient } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components } from './_generated/api';
import { query } from './_generated/server';
import authConfig from './auth.config';
import type {GenericCtx} from '@convex-dev/better-auth';
import type { DataModel } from './_generated/dataModel';

const siteUrl = process.env.SITE_URL!;
const authSecret = process.env.BETTER_AUTH_SECRET!;

// Build trusted origins from SITE_URL
const trustedOrigins = [
  siteUrl,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

// The component client has methods needed for integrating Convex with Better Auth
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    secret: authSecret,
    database: authComponent.adapter(ctx),
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex({ authConfig })],
  });
};

// Get the current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx);
  },
});
