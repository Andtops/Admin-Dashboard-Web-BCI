/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activityLogs from "../activityLogs.js";
import type * as admins from "../admins.js";
import type * as analytics from "../analytics.js";
import type * as apiKeys from "../apiKeys.js";
import type * as auth from "../auth.js";
import type * as collections from "../collections.js";
import type * as cookieConsents from "../cookieConsents.js";
import type * as emails from "../emails.js";
import type * as migration from "../migration.js";
import type * as notifications from "../notifications.js";
import type * as products from "../products.js";
import type * as quotationMessages from "../quotationMessages.js";
import type * as quotations from "../quotations.js";
import type * as security from "../security.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activityLogs: typeof activityLogs;
  admins: typeof admins;
  analytics: typeof analytics;
  apiKeys: typeof apiKeys;
  auth: typeof auth;
  collections: typeof collections;
  cookieConsents: typeof cookieConsents;
  emails: typeof emails;
  migration: typeof migration;
  notifications: typeof notifications;
  products: typeof products;
  quotationMessages: typeof quotationMessages;
  quotations: typeof quotations;
  security: typeof security;
  seed: typeof seed;
  settings: typeof settings;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
