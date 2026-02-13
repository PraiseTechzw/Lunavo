import { supabase } from "./supabase";

export async function sendEmailWithResend(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: params,
  });
  return { data, error };
}
