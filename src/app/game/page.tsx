"use client";

import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    return () => {
      // Cleanup Phaser instance if user navigates away
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const start = async () => {
    if (!containerRef.current) return;
    if (gameRef.current) return;

    const mod = await import("@/game/game");
    gameRef.current = mod.createGame(containerRef.current);
  };

  return (
    <main style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Snowboard Prototype</h2>
        <button
          onClick={start}
          disabled={!ready || !!gameRef.current}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #ccc",
            cursor: "pointer",
          }}
        >
          {gameRef.current ? "Running" : "Play"}
        </button>
      </div>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: 960,
          aspectRatio: "16/9",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid #ddd",
        }}
      />

      <p style={{ marginTop: 10, color: "#555" }}>
        Controls: ←/→ carve, ↑ hop, A/D spin in air, R restart after crash.
      </p>
    </main>
  );
}
