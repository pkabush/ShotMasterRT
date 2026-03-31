import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { MenuBar } from './components/MenuBar';
import FolderList from './components/FolderList';
import { Project } from './classes/Project';
import { ContentView } from "./components/ContentView";
import { NotificationContainer } from './components/NotificationContainer';
import { UserSettingsDB } from './classes/UserSettingsDB';
import { ProjectContext } from './contexts/ProjectContext';
import { Group, Panel, Separator } from 'react-resizable-panels';

const App: React.FC = observer(() => {
  const [project, setProject] = useState<Project | null>(null);
  const userSettingsDB = useRef<UserSettingsDB>(new UserSettingsDB())

  const handleOpenFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      const newProject = new Project(handle, userSettingsDB.current);
      await newProject!.loadFromFolder(handle);
      setProject(newProject);
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
      const newProject = new Project(handle, userSettingsDB.current);
      await newProject!.loadFromFolder(handle);
      setProject(newProject);
    }
  };

  // On app load, open last recent project if available
  useEffect(() => {
    const init = async () => {
      // Load DB      
      await userSettingsDB.current.load()
      // Open Recent Folder on Load
      if (userSettingsDB.current.data.lastOpenedFolder) {
        const lastFolder = userSettingsDB.current.data.lastOpenedFolder;
        let permission = await lastFolder.queryPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
          permission = await lastFolder.requestPermission({ mode: 'readwrite' });
        }
        if (permission === 'granted') {
          const newProject = new Project(lastFolder, userSettingsDB.current);
          await newProject!.loadFromFolder(lastFolder);
          setProject(newProject);
        }
      }
    };

    if (!project) init();

  }, []);

  return (
    <ProjectContext.Provider value={{ project }}>
      <div style={{ minHeight: '100vh' }}>
        <MenuBar
          onOpenFolder={handleOpenFolder}
          recentFolders={userSettingsDB.current.data.recentFolders}
          onOpenRecent={handleOpenRecent}
          project={project}
        />
        {/* Main layout */}
        <div style={{ height: 'calc(100vh - 56px)' }}>
          <Group orientation="horizontal" style={{ height: "100%" }}>

            {/* Sidebar */}
            <Panel defaultSize={250} minSize={10}>
              <FolderList project={project} />
            </Panel>

            {/* Resizable separator */}
            <Separator
              style={{
                width: "3px",
                backgroundColor: "#8f8f8f",
                cursor: "ew-resize",
              }}
            />

            {/* Content */}
            <Panel minSize={20}>
              <div className="d-flex flex-column h-100 overflow-hidden">
                <div className="flex-grow-1 overflow-auto p-3">
                  <ContentView project={project} />
                </div>
              </div>
            </Panel>
          </Group>
        </div>

        <NotificationContainer />
      </div>
    </ProjectContext.Provider>
  );
});

export default App;
