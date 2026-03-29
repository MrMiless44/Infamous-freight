import crypto from "crypto";
import { prisma } from "../db/prisma.js";
import * as json from "./store.js";

// Local type definitions mirroring the JSON store shape
interface StoredAvatar {
  id: string;
  ownerUserId: string;
  fileName: string;
  name: string;
  url: string;
  type: "user" | "system";
  uploadedAt: string;
}

interface AvatarSelection {
  avatarId: string;
  userId: string;
}

export async function ensureUser(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email: `${userId}@placeholder.invalid` },
  });
}

export async function listUserAvatars(userId: string): Promise<StoredAvatar[]> {
  return (json as any).getUserAvatars(userId);
}

export async function createUserAvatar(
  userId: string,
  name: string,
  imageUrl: string,
): Promise<StoredAvatar> {
  return (json as any).addAvatar(userId, {
    id: `av_${crypto.randomBytes(10).toString("hex")}`,
    fileName: imageUrl,
    name,
    type: "user",
    uploadedAt: new Date().toISOString(),
  });
}

export async function getSelection(userId: string): Promise<AvatarSelection | null> {
  return (json as any).getSelectedAvatar(userId);
}

export async function setSelection(
  userId: string,
  selection: AvatarSelection,
): Promise<AvatarSelection> {
  return (json as any).selectAvatar(userId, selection);
}
