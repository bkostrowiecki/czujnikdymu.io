'use server';

import { clearSsrPbCookie } from "../shared/pocketbase-ssr";

export async function signOutAction() {
    await clearSsrPbCookie();

    return {
        success: true
    }
}