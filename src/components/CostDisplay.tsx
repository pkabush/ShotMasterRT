import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import type { Project } from "../classes/Project";

interface CostDisplayProps {
  project: Project;
}

type FloatDelta = {
  id: number;
  value: number;
};

export const CostDisplay: React.FC<CostDisplayProps> = observer(({ project }) => {
  const costTracker = project.costTracker;

  if (!costTracker) return null;

  const total = costTracker.totalCost();
  const daily = costTracker.totalCostToday();

  const prevRef = useRef(total);
  const idRef = useRef(0);

  // Load once
  const [glow, setGlow] = useState(false);
  const [deltas, setDeltas] = useState<FloatDelta[]>([]);

  useEffect(() => {
    const prev = prevRef.current;

    if (prev !== total) {
      const diff = total - prev;

      // Play sound only when money increases
      if (diff > 0) {
        console.log("PLAY SOUND")
        const audio = new Audio("assets/sounds/cha-ching-money.mp3");
        audio.volume = 0.25; // 25%
        audio.currentTime = 0; // restart if already playing
        audio.play().catch((err) => { console.error("Failed to play sound:", err); });
      }

      // glow pulse
      setGlow(true);
      setTimeout(() => setGlow(false), 1000);

      // floating number
      const id = idRef.current++;
      setDeltas((d) => [...d, { id, value: diff }]);

      // cleanup after animation
      setTimeout(() => {
        setDeltas((d) => d.filter((x) => x.id !== id));
      }, 3000);

      prevRef.current = total;
    }
  }, [total]);

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        padding: "6px 10px",
        borderRadius: 8,
        backdropFilter: "blur(6px)",
        fontSize: 13,
        userSelect: "none",
        minWidth: 110,
        transition: "box-shadow 200ms ease, transform 200ms ease",
        boxShadow: glow
          ? "0 0 14px rgba(245, 197, 66, 0.9), 0 0 28px rgba(245, 197, 66, 0.4)"
          : "0 0 0 rgba(0,0,0,0)",
        transform: glow ? "scale(1.03)" : "scale(1)",
      }}
    >
      {/* FLOATING DELTAS */}
      {deltas.map((d) => (
        <div
          key={d.id}
          style={{
            position: "absolute",
            right: 10,
            bottom: -20,
            fontSize: 12,
            fontWeight: 700,
            pointerEvents: "none",

            color: d.value >= 0 ? "#2ecc71" : "#ff4d4d",

            animation: "floatDownFade 3000ms ease forwards",
          }}
        >
          {d.value >= 0 ? `+${d.value.toFixed(5)}` : d.value.toFixed(5)}$
        </div>
      ))}

      {/* MAIN TEXT */}
      <div style={{ color: "#f5c542", fontWeight: 600 }}>
        total: {total.toFixed(2)}$
      </div>

      <div style={{ color: "#2ecc71", fontWeight: 600 }}>
        daily: {daily.toFixed(2)}$
      </div>

      {/* INLINE KEYFRAMES (must be injected once) */}
      <style>
        {`
          @keyframes floatDownFade {
            0% {
              opacity: 0;
              transform: translateY(-5px) scale(1);
            }
            20% {
              opacity: 1;
            }
            100% {
              opacity: 0;
              transform: translateY(25px) scale(0.95);
            }
          }
        `}
      </style>
    </div>
  );
});