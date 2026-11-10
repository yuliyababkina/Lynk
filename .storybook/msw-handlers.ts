import { http, HttpResponse } from "msw";

/* Supabase is switched off for stories (see viteFinal in main.ts), so the only
   HTTP the app can still make is to its own serverless functions. Only the ones
   a story can reach are listed. */
export const mswHandlers = {
  email: [
    // LynkDataProvider.sendContract posts here after moving the case to "Contract Sent".
    http.post("/api/send-contract", () => HttpResponse.json({ ok: true })),
  ],
};
