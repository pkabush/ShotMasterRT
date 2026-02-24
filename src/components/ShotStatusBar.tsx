import React from "react";
import { observer } from "mobx-react-lite";
import { Shot } from "../classes/Shot";
import type { Scene } from "../classes/Scene";

interface Props {
  scene: Scene; // observable Scene instance
  statuses: string[]; // ordered statuses
}

const ShotStatusBar: React.FC<Props> = observer(({ scene, statuses }) => {
  const totalShots = scene.shots.length;

  if (totalShots === 0) return null;

  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {statuses.map((status) => {
        const count = scene.getShotsWithStatus(status, true); // exact count
        const color = (Shot.shot_states as any)[status] ?? "#aaa";

        // render one square per shot of this status
        return Array.from({ length: count }).map((_, i) => (
          <div
            key={`${status}-${i}`}
            style={{
              width: "4px",   // fixed width
              height: "12px", // fixed height
              backgroundColor: color,
            }}
            title={`${status}`}
          />
        ));
      })}
    </div>
  );
});

export default ShotStatusBar;