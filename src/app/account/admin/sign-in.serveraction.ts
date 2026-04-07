// app/account/admin/actions.ts
"use server";

import { initializeSsrPb, setSsrPbCookie } from "@/app/shared/pocketbase-ssr";
import { createPbInstance } from "@/services/pocketbase";
import { cookies } from "next/headers";

type LoginState = {
  success?: boolean;
  error?: string;
};

export async function signInAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  "use server";

  const pocketbase = await initializeSsrPb();

  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { error: "Brak pola email lub hasła" };
  }

  try {
    const result = await pocketbase
      .collection("users")
      .authWithPassword(email, password);

    setSsrPbCookie(pocketbase);

    if (!result.record) {
      return { error: "Nieprawidłowe dane logowania" };
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Nieprawidłowe dane logowania" };
  }
}