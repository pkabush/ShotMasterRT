// MenuBar.tsx
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { MenuColumn } from './MenuColumn';
import type { SubmenuItemProps } from './SubmenuItem';
import { Project } from '../classes/Project';
//import TextField from './TextField';


interface MenuBarProps {
  onOpenFolder: () => void;
  recentFolders: FileSystemDirectoryHandle[];
  onOpenRecent: (handle: FileSystemDirectoryHandle) => void;
  project: Project | null;
}

export const MenuBar: React.FC<MenuBarProps> = ({ onOpenFolder, recentFolders, onOpenRecent,project}) => {

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
    <Navbar expand={true}>
      <Container fluid>
        <Navbar.Brand>ShotMasterRT</Navbar.Brand>
        <Nav className="me-auto" style={{ userSelect: 'none' }}>
          <MenuColumn title="File" items={fileMenuItems} />
          <MenuColumn title="Edit" items={editMenuItems} />
          <MenuColumn title="Help" items={helpMenuItems} />

          { project && (<>
          <MenuColumn
            title="Settings"
            onClick={() => project.setView({ type: "settings" })}
          />
          <MenuColumn
            title="Script"
            onClick={() => project.setView({ type: "script" })}
          />
          <MenuColumn
            title="Artbook"
            onClick={() => project.setView({ type: "artbook" })}
          />
          <MenuColumn
            title="TaskView"
            onClick={() => project.setView({ type: "taskview" })}
          /></>
          )}

        </Nav>
      </Container>
    </Navbar>
  );
};
