import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Expo } from "npm:expo-server-sdk@3.7.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { to, title, body, data, sound, badge } = await req.json();

        if (!to) {
            return new Response(JSON.stringify({ error: "Missing 'to' (push token)" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const expo = new Expo();
        const messages = [];

        const tokens = Array.isArray(to) ? to : [to];

        for (const token of tokens) {
            if (!Expo.isExpoPushToken(token)) {
                console.error(`Push token ${token} is not a valid Expo push token`);
                continue;
            }

            messages.push({
                to: token,
                sound: sound || "default",
                title: title || "New Notification",
                body: body || "",
                data: data || {},
                badge: badge,
            });
        }

        if (messages.length === 0) {
            return new Response(JSON.stringify({ error: "No valid tokens" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error(error);
            }
        }

        return new Response(JSON.stringify({ tickets }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
});
