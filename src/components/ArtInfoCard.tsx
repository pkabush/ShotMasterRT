// ArtInfoCard.tsx
import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Art } from "../classes/Art";
import EditableJsonTextField from "./EditableJsonTextField";

interface Props {
  art: Art;
  onClose: () => void;
}

const ArtInfoCard: React.FC<Props> = observer(({ art, onClose }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

    useEffect(() => {
        let mounted = true;
        let currentArt = art;

        // Reset loading state for new art
        setLoadingInfo(true);
        setUrl(null);

        async function load() {
            // Load image URL
            const u = await currentArt.image.getUrlObject();
            if (!mounted || art !== currentArt) return; // ignore stale load
            setUrl(u);

            // Load artInfo JSON
            const info = await currentArt.getArtInfo();
            if (!mounted || art !== currentArt) return; // ignore stale load
            currentArt.artInfo = info;

            setLoadingInfo(false);
        }

        load();

        return () => {
            mounted = false;
        };
    }, [art]);

  const name = art.handle.name;

  if (loadingInfo) {
    return <div>Loading art info...</div>;
  }

  return (
    <div
      className="art-info-card"
      style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}
    >
      <div
        className="card-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <strong>{name}</strong>
        <button
          onClick={onClose}
          style={{ cursor: "pointer", border: "none", background: "transparent", fontSize: "1.2rem" }}
        >
          ✕
        </button>
      </div>

      {/* Larger preview image */}
      {url ? (
        <img
          src={url}
          className="preview-img"
          style={{
            maxWidth: "1000px",
            width: "auto",
            maxHeight: "1000px",
            objectFit: "contain",
            borderRadius: "4px",
            display: "block",
            marginBottom: "1rem",
          }}
        />
      ) : (
        <div style={{ padding: "4rem", textAlign: "center" }}>
          <span>Loading image...</span>
        </div>
      )}

      {/* Editable prompt field */}
      {art.artInfo && (
        <EditableJsonTextField localJson={art.artInfo} field="prompt" fitHeight />
      )}

      {/* Buttons */}
      {/*
      <div
        className="button-row"
        style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }} >
        <button onClick={() => console.log("LOG", art)}>LOG</button>
        <button onClick={() => console.log("GPT Describe TODO")}>GPT Describe</button>
        <button onClick={() => console.log("GPT ENV Describe TODO")}>GPT ENV Describe</button>
      </div>
      */}



    </div>
  );
});

export default ArtInfoCard;
