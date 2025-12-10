// FolderList.tsx
import React from 'react';
import { observer } from 'mobx-react-lite';
import SceneListItem from './SceneListItem.tsx';
import { Project } from '../classes/Project';

type FolderListProps = {
  project: Project | null;
};

const FolderList: React.FC<FolderListProps> = observer(({ project }) => {
  if (!project) return <div>No Project Opened</div>;


  const folders = project.scenes.map(scene => scene.folder);
  const currentFolderName = project.rootDirHandle?.name || 'No Project Opened';

  return (
    <div
      style={{
        width: '200px',
        borderRight: '1px solid #ced4da',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h5 style={{ flexShrink: 0 }}>{currentFolderName}</h5>

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
