import React, { useEffect, useState } from "react";
import { Art } from "../classes/Art";

interface ArtDropdownItemProps {
  art: Art;
  onClick: () => void;
}

const ArtDropdownItem: React.FC<ArtDropdownItemProps> = ({ art, onClick }) => {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    art.image.getUrlObject().then((u) => {
      if (mounted) setUrl(u);
    });

    return () => {
      mounted = false;
      art.image.revokeUrl();
    };
  }, [art]);

  return (
    <div
      className="px-2 py-1 hover-bg-light d-flex align-items-center"
      style={{ cursor: "pointer", gap: 6 }}
      onClick={onClick}
    >
      {url && (
        <img
          src={url}
          alt={art.handle.name}
          style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 2 }}
        />
      )}
      <span>{art.handle.name}</span>
    </div>
  );
};

export default ArtDropdownItem;
