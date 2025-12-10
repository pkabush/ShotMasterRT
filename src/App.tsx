import React, { useState, useEffect } from 'react';
import { MenuBar } from './components/MenuBar';
import FolderList from './components/FolderList';
import { savePickedFolder, loadRecentFolders } from './db';
import { useContent } from './contexts/ContentContext';

const App: React.FC = () => {
  const [sceneFolders, setSceneFolders] = useState<FileSystemDirectoryHandle[]>([]);
  const [recentFolders, setRecentFolders] = useState<FileSystemDirectoryHandle[]>([]);
  
  const { contentArea, rootFolder, setRootFolder } = useContent();

  const onProjectOpened = async(handle: FileSystemDirectoryHandle) => {    
    console.log("Opened Project", handle?.name)

    const folders: FileSystemDirectoryHandle[] = [];
    const scenes:FileSystemDirectoryHandle = await handle.getDirectoryHandle("SCENES");
    for await (const entry of scenes.values()) {
      if (entry.kind === 'directory') folders.push(entry);
    }

    setSceneFolders(folders);
    //console.log(sceneFolders);    
  }

  const handleOpenFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      setRootFolder(handle);
      await savePickedFolder(handle);

      // refresh recent folders
      const recent = await loadRecentFolders();
      setRecentFolders(recent);

      await onProjectOpened(handle);
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
      setRootFolder(handle);
      await savePickedFolder(handle);
      await onProjectOpened(handle);
    }
  };

  useEffect(() => {
    const init = async () => {
      // Load recent folders on app start
      const recent = await loadRecentFolders();
      setRecentFolders(recent);

      // Automatically open the last opened folder if available
      if (recent.length > 0) {
        const lastFolder = recent[recent.length - 1];
        let permission = await lastFolder.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          permission = await lastFolder.requestPermission({ mode: 'readwrite' });
        }
        if (permission === 'granted') {
          setRootFolder(lastFolder);
          await onProjectOpened(lastFolder);
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
      />
      <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
        {
        <FolderList folders={sceneFolders} currentFolderName={rootFolder?.name}/>
        }        
        <div className="flex-grow-1 p-3">
          {
          // Selected Content area          
          }
          {contentArea}
        </div>
      </div>
    </div>
  );
};

export default App;

