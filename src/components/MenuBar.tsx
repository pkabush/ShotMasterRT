// MenuBar.tsx
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { MenuColumn } from './MenuColumn';
import type { SubmenuItemProps } from './SubmenuItem';
import { useContent } from '../contexts/ContentContext';
import { ArtbookView } from "./ArtbookView";
import { SettingsView } from "./SettingsView";
import { Project } from '../classes/Project';
import { ScriptView } from "./ScriptView";
//import TextField from './TextField';


interface MenuBarProps {
  onOpenFolder: () => void;
  recentFolders: FileSystemDirectoryHandle[];
  onOpenRecent: (handle: FileSystemDirectoryHandle) => void;
  project: Project;
}

export const MenuBar: React.FC<MenuBarProps> = ({ onOpenFolder, recentFolders, onOpenRecent,project}) => {
  const { setContentArea } = useContent();
  
  const fileMenuItems: Omit<SubmenuItemProps, 'parentKey'>[] = [
    { name: 'Open', onClick: onOpenFolder },
    {
      name: 'Recent',
      subItems: recentFolders.length
        ? recentFolders.map((handle) => ({ name: handle.name, onClick: () => onOpenRecent(handle) }))
        : [{ name: 'No Recent' }],
    },
  ];

  const editMenuItems: Omit<SubmenuItemProps, 'parentKey'>[] = [
    { name: 'Undo' },
    { name: 'Redo' },
  ];

  const helpMenuItems: Omit<SubmenuItemProps, 'parentKey'>[] = [{ name: 'About' }];

  return (
    <Navbar expand="lg">
      <Container fluid>
        <Navbar.Brand>ShotMasterRT</Navbar.Brand>
        <Nav className="me-auto" style={{ userSelect: 'none' }}>
          <MenuColumn title="File" items={fileMenuItems} />
          <MenuColumn title="Edit" items={editMenuItems} />
          <MenuColumn title="Help" items={helpMenuItems} />
          <MenuColumn title="Script" onClick={async () => {
            setContentArea(<ScriptView project={project} />);
          }}/>
          <MenuColumn title="Settings" onClick={() => {
            setContentArea(<SettingsView project={project}/>);
          }}/>
          <MenuColumn
            title="Artbook"
            onClick={() => {
              if (!project.artbook) {
                setContentArea(<div>No Artbook found.</div>);
                return;
              }
              setContentArea(<ArtbookView artbook={project.artbook} />);
            }}
          />
        </Nav>
      </Container>
    </Navbar>
  );
};
