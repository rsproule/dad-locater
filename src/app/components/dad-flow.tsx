"use client";

import { useState } from "react";
import DadChat from "./dad-chat";
import RadarScanner from "./radar-scanner";

type Persona = {
  name: string;
  age: number;
  traits: string[];
  style: string;
  voice: string;
  greeting: string;
  departureExcuses: string[];
};

export default function DadFlow() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [imageUrl, setImageUrl] = useState<{
    base64Data: string;
    mediaType: string;
  } | null>(null);
  const [profile, setProfile] = useState<string | null>(null);

  const handleDescribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error("Failed to generate dad persona");
      const data = await res.json();
      setProfile(data.profile);
      setImageUrl(data.imageUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 border rounded overflow-hidden bg-muted">
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:${imageUrl.mediaType};base64,${imageUrl.base64Data}`}
                alt="Dad"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {profile}
            </div>
          </div>
        </div>
        <DadChat
          profile={profile}
          onSearchAgain={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleDescribe} className="space-y-3">
        <label className="text-sm font-medium">Describe your dad</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Be descriptive so we can find him..."
          className="w-full h-28 px-3 py-2 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!description.trim() || loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Find my dad"}
        </button>
      </form>

      {loading && (
        <div className="space-y-2">
          <RadarScanner active={true} />
        </div>
      )}
    </div>
  );
}
