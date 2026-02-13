import { supabase } from "./supabase";

export async function sendEmailWithResend(params: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
}): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: params,
  });
  return { data, error };
}
