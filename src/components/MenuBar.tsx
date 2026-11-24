// MenuBar.tsx
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { MenuColumn } from './MenuColumn';
import type { SubmenuItemProps } from './SubmenuItem';
import { Project } from '../classes/Project';
import { CostDisplay } from './CostDisplay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSquare } from '@fortawesome/free-regular-svg-icons';
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons';
import { observer } from 'mobx-react-lite';
import { useUserStore } from '../contexts/GoogleUserContext';

interface MenuBarProps {
  onOpenFolder: () => void;
  recentFolders: FileSystemDirectoryHandle[];
  onOpenRecent: (handle: FileSystemDirectoryHandle) => void;
  onClearRecents: () => void;
  project: Project | null;
}

export const MenuBar = observer(({
  onOpenFolder,
  recentFolders,
  onOpenRecent,
  onClearRecents,
  project,
}: MenuBarProps) => {

  const fileMenuItems: Omit<SubmenuItemProps, 'parentKey'>[] = [
    {
      name: 'Open',
      onClick: onOpenFolder,
    },
    {
      name: 'Recent',
      subItems: recentFolders.length
        ? recentFolders.map((handle) => ({
          name: handle.name,
          onClick: () => onOpenRecent(handle),
        }))
        : [{ name: 'No Recent' }],
    },
    {
      name: 'Clear Recent',
      onClick: onClearRecents,
    },
  ];

  const user = useUserStore((s) => s.user);

  return (
    <>
      <Navbar expand={true}>
        <Container fluid>
          <Navbar.Brand>ShotMasterRT</Navbar.Brand>

          {/* LEFT SIDE */}
          <Nav className="me-auto" style={{ userSelect: 'none' }}>
            <MenuColumn title="File" items={fileMenuItems} />

            {project && (
              <>
                <Nav.Link onClick={() => project.setView({ type: "script" })}> Script</Nav.Link>
                <Nav.Link onClick={() => project.setView({ type: "settings" })}> Settings</Nav.Link>
                <Nav.Link onClick={() => project.setView({ type: "taskview" })}> TaskView</Nav.Link>
                <Nav.Link onClick={() => project.setView({ type: "promptview" })}> PromptView</Nav.Link>

                <NavDropdown title="Options" id="basic-nav-dropdown">
                  <NavProjectOptionToggle
                    name="settings/ui/shot_strip_autoplay"
                    label='Shot Strip Autoplay'
                    project={project}
                    defaultValue={true}
                  />
                  <NavProjectOptionToggle
                    name="settings/ui/mediafolder_autoplay"
                    label='Media Folder Autoplay'
                    project={project}
                    defaultValue={true}
                  />
                </NavDropdown>

                {user?.admin &&
                  <Nav.Link onClick={() => project.setView({ type: "stats" })}> Admin</Nav.Link>
                }
              </>
            )}
          </Nav>
        </Container>
      </Navbar>

      {project && <CostDisplay project={project} />}
    </>
  );
});




interface NavProjectOptionToggleProps {
  project: Project;
  name: string;
  label?: string;
  defaultValue?: boolean;
}

const NavProjectOptionToggle = observer(({
  project,
  label,
  name,
  defaultValue = false,
}: NavProjectOptionToggleProps) => {

  const value = project.projinfo?.getField(name);
  const isEnabled = value !== undefined && value !== null
    ? !!value
    : defaultValue;

  const toggle = () => {
    project.projinfo?.updateField(name, !isEnabled);
  };

  return (
    <NavDropdown.Item
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
    >
      <FontAwesomeIcon
        icon={isEnabled ? faSquareCheck : faSquare}
        className="me-2"
      />
      {label ?? name}
    </NavDropdown.Item>
  );
});