import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Snowboard Game (Prototype)</h1>
      <p style={{ marginBottom: 16 }}>
        A simple 2D infinite-slope snowboard prototype built with Next.js + Phaser.
      </p>

      <Link
        href="/game"
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #ccc",
          textDecoration: "none",
        }}
      >
        Play →
      </Link>

      <div style={{ marginTop: 18, color: "#555", maxWidth: 720, lineHeight: 1.4 }}>
        <p><b>Controls</b></p>
        <ul>
          <li><b>Left/Right</b>: carve</li>
          <li><b>Up</b>: hop (small jump if grounded)</li>
          <li><b>A/D</b>: spin while airborne (tricks)</li>
          <li><b>R</b>: restart after crash</li>
        </ul>
      </div>
    </main>
  );
}
