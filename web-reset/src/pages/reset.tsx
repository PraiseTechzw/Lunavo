import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Reset() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email) return;
    setLoading(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/change-password`,
      });
      if (error) throw error;
      setMessage(
        "Reset email sent. Open the link on this device to change your password.",
      );
    } catch (err: any) {
      setError(err?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>Request Password Reset</h1>
      <p className="muted">
        Enter your PEACE account email. You will receive a recovery link.
      </p>
      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <input
          className="input"
          type="email"
          placeholder="name@cut.ac.zw"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="btn" disabled={loading || !email} type="submit">
          {loading ? "Sending..." : "Send Reset Email"}
        </button>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
      {error && <p style={{ marginTop: 12, color: "#fca5a5" }}>{error}</p>}
    </main>
  );
}
