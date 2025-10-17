import { auth } from "@clerk/nextjs/server";

export async function getAuthToken() {
  const { getToken } = auth();
  return await getToken({ template: "convex" });
}

// For use in Convex functions
export async function getCurrentUserId(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  return identity?.subject;
}