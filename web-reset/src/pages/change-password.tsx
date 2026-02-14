import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionOk, setSessionOk] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setSessionOk(!!data.session);
    };
    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!sessionOk) {
      setError("No recovery session. Open the link from your email on this device.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. You can now open the PEACE app and sign in with your new password.");
    } catch (err: any) {
      setError(err?.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>Change Password</h1>
      {!sessionOk && (
        <p className="muted">
          Open the password recovery link from your email on this device to continue.
        </p>
      )}
      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <input
          className="input"
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          style={{ marginTop: 10 }}
        />
        <button className="btn" disabled={loading} type="submit">
          {loading ? "Updating..." : "Set New Password"}
        </button>
      </form>
      {message && <p style={{ marginTop: 12 }}>{message}</p>}
      {error && <p style={{ marginTop: 12, color: "#fca5a5" }}>{error}</p>}
    </main>
  );
}
