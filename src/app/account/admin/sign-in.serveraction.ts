// app/account/admin/actions.ts
"use server";

import { cookies } from "next/headers";
import { initializeSsrPb, setSsrPbCookie } from "@/app/shared/pocketbase-ssr";
import { createPbInstance } from "@/services/pocketbase";

type LoginState = {
  success?: boolean;
  error?: string;
};

export async function signInAction(
  prevState: LoginState,
  formData: FormData,
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

    await setSsrPbCookie(pocketbase);

    if (!result.record) {
      return { error: "Nieprawidłowe dane logowania" };
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    return { error: "Nieprawidłowe dane logowania" };
  }
}
