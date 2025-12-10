import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { MenuBar } from './components/MenuBar';
import FolderList from './components/FolderList';
import { savePickedFolder, loadRecentFolders } from './db';
import { useContent } from './contexts/ContentContext';
import { Project } from './classes/Project';

const App: React.FC = observer(() => {
  const [project] = useState(() => new Project(null)); // MobX observable Project
  const [recentFolders, setRecentFolders] = useState<FileSystemDirectoryHandle[]>([]);

  const { contentArea, rootFolder, setRootFolder } = useContent();

  // Open a folder and load it into the Project
  const openProjectFolder = async (handle: FileSystemDirectoryHandle) => {
    setRootFolder(handle);
    project.setRootDirHandle(handle);
    await savePickedFolder(handle);
    await project.load();
  };

  const handleOpenFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      await openProjectFolder(handle);

      // refresh recent folders
      const recent = await loadRecentFolders();
      setRecentFolders(recent);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenRecent = async (handle: FileSystemDirectoryHandle) => {
    let permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
      permission = await handle.requestPermission({ mode: 'readwrite' });
    }
    if (permission === 'granted') {
      await openProjectFolder(handle);
    }
  };

  // On app load, open last recent project if available
  useEffect(() => {
    const init = async () => {
      const recent = await loadRecentFolders();
      setRecentFolders(recent);

      if (recent.length > 0) {
        const lastFolder = recent[recent.length - 1];
        let permission = await lastFolder.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          permission = await lastFolder.requestPermission({ mode: 'readwrite' });
        }
        if (permission === 'granted') {
          await openProjectFolder(lastFolder);
        }
      }
    };

    init();
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <MenuBar
        onOpenFolder={handleOpenFolder}
        recentFolders={recentFolders}
        onOpenRecent={handleOpenRecent}
        project={project}   
      />
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
        <FolderList project={project} />
        <div className="flex-grow-1 p-3">
          {contentArea}
        </div>
      </div>
    </div>
  );
});

export default App;
