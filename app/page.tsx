"use client";

import { useState } from "react";

export default function Home() {
  const [mood, setMood] = useState("");
  const [schema, setSchema] = useState(null);

  async function handleSubmit() {
    const res = await fetch("/api/mood", {
      method: "POST",
      body: JSON.stringify({ mood }),
    });

    const json = await res.json();
    setSchema(json);
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Mood Blocks</h1>

      <div style={{ display: "flex", gap: 10 }}>
        {["Calm", "Stressed", "Energized", "Overwhelmed"].map((m) => (
          <button key={m} onClick={() => setMood(m.toLowerCase())}>
            {m}
          </button>
        ))}
      </div>

      <input
        placeholder="Or type your mood..."
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        style={{ marginTop: 20 }}
      />

      <button onClick={handleSubmit} style={{ marginLeft: 10 }}>
        Go
      </button>

      {schema ? (
        <pre style={{ marginTop: 20 }}>{JSON.stringify(schema, null, 2)}</pre>
      ) : null}
    </main>
  );
}
