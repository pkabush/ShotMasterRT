import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { MenuBar } from './components/MenuBar';
import FolderList from './components/FolderList';
import { Project } from './classes/Project';
import { ContentView } from "./components/ContentView";

const App: React.FC = observer(() => {
  const [project] = useState(() => new Project(null)); // MobX observable Project

  const handleOpenFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      await project.loadFromFolder(handle);
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
      await project.loadFromFolder(handle);
    }
  };

  // On app load, open last recent project if available
  useEffect(() => {
    const init = async () => {
      // Load DB
      await project.loadDB();
      // Open Recent Folder on Load
      if (project.userSettingsDB.data.lastOpenedFolder) {
        const lastFolder = project.userSettingsDB.data.lastOpenedFolder;
        let permission = await lastFolder.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          permission = await lastFolder.requestPermission({ mode: 'readwrite' });
        }
        if (permission === 'granted') {
          await project.loadFromFolder(lastFolder);
        }
      }
    };

    init();
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <MenuBar
        onOpenFolder={handleOpenFolder}
        recentFolders={project.userSettingsDB.data.recentFolders}
        onOpenRecent={handleOpenRecent}
        project={project}   
      />
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
        <FolderList project={project} />
        <div className="flex-grow-1 p-3">
          {/*contentArea*/}
          <ContentView project={project} />
        </div>
      </div>
    </div>
  );
});

export default App;
