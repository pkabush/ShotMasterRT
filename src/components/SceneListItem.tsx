import React from 'react';
import { useContent } from '../contexts/ContentContext';
import TabsContainer from './TabsContaier';
import EditableJsonTextField from './EditableJsonTextField';
import { Scene } from '../classes/Scene';

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
      console.log('Loaded scene', folder.name, s.shots.map((s) => s.name));
    };
    load();
  }, [folder]);

  const handleClick = () => {
    if (!scene || !scene.sceneJson) return;

    setContentArea(
      <div>
        <h2>{folder.name}</h2>

        {/* List shots */}
        {scene.shots.length > 0 && (
          <div>
            <strong>Shots:</strong>
            <ul>
              {scene.shots.map((s) => (
                <li key={s.name}>{s.name}</li>
              ))}
            </ul>
          </div>
        )}

        <TabsContainer
          tabs={{
            Scene: (
              <div>
                <EditableJsonTextField localJson={scene.sceneJson} field="script" />
              </div>
            ),
            Shots: <div>Shots info here.</div>,
          }}
        />
      </div>
    );
  };

  return (
    <li style={{ padding: '4px 0', cursor: 'pointer' }} onClick={handleClick}>
      {folder.name}
    </li>
  );
};

export default SceneListItem;
