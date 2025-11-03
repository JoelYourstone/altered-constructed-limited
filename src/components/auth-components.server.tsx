"use server";

import { signIn, signOut } from "@/auth";

export async function signInAction() {
  await signIn();
}

export async function signOutAction() {
  await signOut();
}
