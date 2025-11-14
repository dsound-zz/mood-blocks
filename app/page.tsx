"use client";

import { FormEvent, useState } from "react";
import MoodRenderer from "./components/MoodRenderer";
import type { MoodComponentSchema } from "./types/schema";
import { unlockAudio } from "./utils/sound";

export default function Home() {
  const [mood, setMood] = useState("");
  const [schema, setSchema] = useState<MoodComponentSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await unlockAudio();
    if (!mood.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/mood", {
        method: "POST",
        body: JSON.stringify({ mood }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error("Unable to generate mood right now.");
      }

      const json = (await res.json()) as MoodComponentSchema;
      setSchema(json);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnd = () => {
    setSchema(null);
    setMood("");
  };

  if (schema) {
    return (
      <MoodRenderer
        schema={schema}
        onEnd={handleEnd}
        moodLabel={mood.trim() || undefined}
      />
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "white",
        padding: "2rem",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          How are you?
        </h1>
        <input
          type="text"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="Try calm, excited, overwhelmed..."
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid rgba(255,255,255,0.2)",
            fontSize: "1rem",
            background: "rgba(2,6,23,0.6)",
            color: "white",
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          onClick={() => {
            void unlockAudio();
          }}
          style={{
            padding: "0.85rem 1rem",
            borderRadius: "0.75rem",
            border: "none",
            fontSize: "1rem",
            background: "white",
            color: "#020617",
            fontWeight: 600,
            cursor: isLoading ? "wait" : "pointer",
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? "Hold on..." : "Go"}
        </button>
        {error && (
          <p style={{ color: "#fda4af", fontSize: "0.9rem" }}>{error}</p>
        )}
      </form>
    </main>
  );
}
