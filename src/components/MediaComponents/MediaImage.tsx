import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { LocalImage } from "../../classes/fileSystem/LocalImage";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  localImage: LocalImage;
}

const MediaImage: React.FC<Props> = observer(({ localImage, ...props }) => {
  const [loaded, setLoaded] = useState(!!localImage.urlObject);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!localImage.urlObject) {
        await localImage.getUrlObject();
        if (isMounted) setLoaded(true); // force re-render
      } else {
        setLoaded(true);
      }
    };

    load();

    return () => { isMounted = false; };
  }, [localImage]);

  if (!loaded) {
    return <div>Loading...</div>;
  }

  return <img src={localImage.urlObject!} {...props} />;
});

export default MediaImage;