import { v } from 'convex/values';
import { internalMutation } from './_generated/server';

// One-time bootstrap mutation to set the first admin
// Run this from the Convex dashboard: Functions -> bootstrap:setFirstAdmin
// After use, you can delete this file
export const setFirstAdmin = internalMutation({
  args: { email: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique();

    if (!user) {
      return `User with email ${args.email} not found`;
    }

    await ctx.db.patch("users", user._id, {
      role: 'admin',
      roleUpdatedAt: Date.now(),
    });

    return `Successfully set ${args.email} as admin`;
  },
});
