import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <h1>PEACE Password Reset</h1>
      <p className="muted">
        Use this site to request a password reset and then change your password.
      </p>
      <p style={{ marginTop: 16 }}>
        <Link className="btn" href="/reset">Request Reset Email</Link>
      </p>
    </main>
  );
}
