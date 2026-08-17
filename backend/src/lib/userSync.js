import { clerkClient } from "@clerk/express";

import User from "../models/user.model.js";

// We learn about a Clerk user from two places that disagree on casing: webhook
// payloads arrive as raw snake_case JSON, while the Backend SDK hands back
// camelCase resources. Normalise both here so the mapping only lives in one file.

function fieldsFromWebhook(u) {
  const email =
    u.email_addresses?.find((e) => e.id === u.primary_email_address_id)?.email_address ??
    u.email_addresses?.[0]?.email_address;

  return {
    clerkId: u.id,
    email,
    fullName:
      [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || email?.split("@")[0],
    profilePic: u.image_url,
  };
}

function fieldsFromSdk(u) {
  const email =
    u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ??
    u.emailAddresses?.[0]?.emailAddress;

  return {
    clerkId: u.id,
    email,
    fullName:
      [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || email?.split("@")[0],
    profilePic: u.imageUrl,
  };
}

async function upsert(fields) {
  // email and fullName are required by the schema, so someone who signed up without
  // an email address can't be stored. Report that instead of throwing a validation error.
  if (!fields.email) return null;

  try {
    return await User.findOneAndUpdate({ clerkId: fields.clerkId }, fields, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
  } catch (error) {
    // Two requests can race to insert the same new user. The loser hits a duplicate
    // key error, by which point the winner's document is there to read.
    if (error?.code === 11000) return User.findOne({ clerkId: fields.clerkId });
    throw error;
  }
}

export function syncUserFromWebhook(data) {
  return upsert(fieldsFromWebhook(data));
}

// Fallback for when the webhook never arrived: ask Clerk who this is and store them
// on their first authenticated request.
export async function syncUserFromClerk(clerkId) {
  const clerkUser = await clerkClient.users.getUser(clerkId);
  return upsert(fieldsFromSdk(clerkUser));
}
