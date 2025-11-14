"use client";

type BinauralInfoOverlayProps = {
  mode: "hidden" | "initial" | "reminder";
  beatHz: number | null;
  isBinaural: boolean;
};

const formatBeatText = (beatHz: number | null) => {
  if (beatHz == null || Number.isNaN(beatHz)) {
    return "Binaural beat in progress";
  }
  return `Binaural beat around ~${Math.round(beatHz)} Hz`;
};

export default function BinauralInfoOverlay({
  mode,
  beatHz,
  isBinaural,
}: BinauralInfoOverlayProps) {
  if (!isBinaural || mode === "hidden") {
    return null;
  }

  const showAboveHumanNote = typeof beatHz === "number" && beatHz > 20;
  const animationDuration = mode === "initial" ? "4s" : "3s";

  return (
    <>
      <div
        className={`binaural-overlay binaural-overlay--${mode}`}
        style={{ animationDuration }}
      >
        <p>{formatBeatText(beatHz)}</p>
        {showAboveHumanNote && <p>Tones for your mind, not your ears.</p>}
        <p>Best with headphones.</p>
      </div>
      <style jsx>{`
        .binaural-overlay {
          position: fixed;
          bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
          left: 50%;
          transform: translateX(-50%);
          max-width: 90vw;
          padding: 0.85rem 1.5rem;
          border-radius: 999px;
          background: rgba(5, 9, 20, 0.75);
          color: rgba(255, 255, 255, 0.92);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(6px);
          pointer-events: none;
          text-align: center;
          font-size: 0.9rem;
          line-height: 1.3;
          animation-name: binauralOverlayFade;
          animation-timing-function: ease-in-out;
          animation-fill-mode: forwards;
          z-index: 10;
        }

        .binaural-overlay p {
          margin: 0;
          white-space: normal;
        }

        .binaural-overlay p + p {
          margin-top: 0.15rem;
        }

        @keyframes binauralOverlayFade {
          0% {
            opacity: 0;
            transform: translate(-50%, 15px);
          }
          15% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          80% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
        }
      `}</style>
    </>
  );
}
