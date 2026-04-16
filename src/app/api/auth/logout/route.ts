import { NextResponse } from "next/server";

const clearCookie = (response: NextResponse, name: string) => {
  response.cookies.set({
    name,
    value: "",
    expires: new Date(0),
    path: "/",
  });
};

export async function POST() {
  const response = NextResponse.json({ ok: true });

  clearCookie(response, "sid");
  clearCookie(response, "trusted_device_token");
  clearCookie(response, "fsa_access_token");
  clearCookie(response, "fsa_access_token_expires_at");
  clearCookie(response, "fsa_refresh_token");
  clearCookie(response, "fsa_refresh_token_expires_at");

  return response;
}