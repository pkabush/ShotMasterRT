import React from 'react';
import { useContent } from '../contexts/ContentContext';
import TabsContainer from './TabsContaier';
import EditableJsonTextField from './EditableJsonTextField';
import { Scene } from '../classes/Scene';
import ShotsInfoStrip from './ShotsInfoStrip';

type Props = {
  folder: FileSystemDirectoryHandle;
};

const SceneListItem: React.FC<Props> = ({ folder }) => {
  const { setContentArea } = useContent();
  const [scene, setScene] = React.useState<Scene | null>(null);

  React.useEffect(() => {
    const load = async () => {
      const s = new Scene(folder);
      await s.load();
      setScene(s);
      //console.log('Loaded scene', s);
    };
    load();
  }, [folder]);

  const handleClick = () => {
    if (!scene || !scene.sceneJson) return;

    setContentArea(
      <div>
        <h2>{folder.name}</h2>
        <TabsContainer
          tabs={{
            Scene: (
              <div>
                <EditableJsonTextField localJson={scene.sceneJson} field="script" />
              </div>
            ),
            Shots: scene && <ShotsInfoStrip scene={scene} />,
          }}
        />
      </div>
    );
  };

  return (
    <li
      className="d-flex justify-content-between align-items-center py-1 px-2"
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
    >
      {/* Scene name */}
      <span>{folder.name}</span>

      {/* Shots count */}
      <span>{scene?.shots.length ?? 0}</span>
    </li>
  );
};

export default SceneListItem;
