import React from 'react';
import SceneListItem from './SceneListItem.tsx';

type FolderListProps = {
  folders: FileSystemDirectoryHandle[];
  currentFolderName?: string;
};

const FolderList: React.FC<FolderListProps> = ({ folders, currentFolderName }) => {
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
      <h5 style={{ flexShrink: 0 }}>
        {currentFolderName ? currentFolderName : 'No Project Opened'}
      </h5>

      {/* Scrollable area */}
      <ul
        className="list-unstyled"
        style={{
          margin: 0,
          padding: 0,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 100px)', // adjust as needed
        }}
      >
        {folders.map((folder, idx) => (
          <SceneListItem key={idx} folder={folder} />
        ))}
      </ul>
    </div>
  );
};

export default FolderList;
