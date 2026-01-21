import React from 'react';
import { observer } from 'mobx-react-lite';
import SceneListItem from './SceneListItem.tsx';
import { Project } from '../classes/Project';
import SimpleButton from './Atomic/SimpleButton.tsx';

type FolderListProps = {
  project: Project | null;
};

const FolderList: React.FC<FolderListProps> = observer(({ project }) => {
  if (!project) return <div>No Project Opened</div>;

  const handleAddScene = async () => {
    const sceneName = prompt("Enter new scene name");
    if (!sceneName) return;

    await project.createScene(sceneName);
  };

  const currentFolderName = project.rootDirHandle?.name || 'No Project Opened';

  return (
    <div
      style={{
        width: '200px',    
        minWidth: '200px'    ,
        borderRight: '1px solid #ced4da',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Project Name */}
      <h5 style={{ flexShrink: 0, marginBottom: 8 }}>{currentFolderName}</h5>

      {/* Add Scene Button */}
      <SimpleButton label="+ Add Scene" onClick={handleAddScene} className="mb-2" />

      {/* Scene List */}
      <ul
        className="list-unstyled"
        style={{
          margin: 0,
          padding: 0,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 100px)',
        }}
      >
        {project.scenes.map((scene, idx) => (
          <SceneListItem key={idx} scene={scene} />
        ))}
      </ul>
    </div>
  );
});

export default FolderList;
