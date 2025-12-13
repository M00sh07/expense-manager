import { Resend } from "resend";

export function getResend(apiKey) {
  if (!apiKey) {
    throw new Error("Resend API key missing");
  }
  return new Resend(apiKey);
}
