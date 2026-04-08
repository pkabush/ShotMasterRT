import React from 'react';
import { observer } from 'mobx-react-lite';
import SceneListItem from './SceneListItem.tsx';
import { Project } from '../classes/Project';
import SimpleButton from './Atomic/SimpleButton.tsx';
import { Accordion, ListGroup } from 'react-bootstrap';
import { CollapsibleAccordionCard } from './Atomic/CollapsibleContainer.tsx';
import * as ContextMenu from "@radix-ui/react-context-menu";
import { MenuItemIcon } from './MediaFolderGallery.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboard, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { ScriptMaster } from '../classes/ScriptMaster.ts';
import type { LocalFile } from '../classes/fileSystem/LocalFile.ts';

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

  const currentFolderName = project.name || 'No Project Opened';
  const scriptmaster = project.getType(ScriptMaster)[0];

  return (
    <div
      style={{
        width: '100%',
        borderRight: '1px solid #ced4da',
        padding: '10px',
        paddingBottom: '60px',
        display: 'flex',
        flexDirection: 'column',
        height: "100%",
        overflow: 'hidden',
      }}
    >
      {/* Project Name */}
      <h5 style={{ flexShrink: 0, marginBottom: 8 }}>{currentFolderName}</h5>

      <Accordion defaultActiveKey="Scenes" style={{
        flex: 1,
        overflowY: 'auto',
        minHeight: 0, // 👈 critical for flexbox scrolling
      }}>
        <CollapsibleAccordionCard label='Artbook' closedColor='#573c2a' openColor='#b16616'>
          <Accordion>
            <div id="Artbook-Contents" style={{
              marginLeft: '10px',
            }}>
              {project.artbook?.subfolders.map((subfolder) => {
                return <CollapsibleAccordionCard label={subfolder.name} key={subfolder.path} headerExtra={
                  <SimpleButton label="+" onClick={() => { project.artbook?.createCharacter(subfolder) }} />
                }>
                  <ListGroup>
                    {subfolder.subfolders.map((character) => {
                      return <ContextMenu.Root key={character.path}>
                        <ContextMenu.Trigger>
                          <li
                            className="d-flex justify-content-between align-items-center py-1 px-2"
                            style={{ cursor: 'pointer' }}
                            onClick={() => { project.setArtbookItem(character.path) }}
                            onContextMenu={() => project.setArtbookItem(character.path)}
                            key={character.path}
                          >
                            {/* Scene name */}
                            <span
                              className={project.selectedPath == character.path ? 'text-success' : undefined}
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                minWidth: 0,
                              }}
                            >
                              {character.name}
                            </span>

                          </li>
                        </ContextMenu.Trigger>

                        <ContextMenu.Portal>
                          <ContextMenu.Content className="ContextMenuContent">

                            <ContextMenu.Item className="ContextMenuItem" onClick={() => character.log()}>
                              <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                              Log
                            </ContextMenu.Item>

                            <ContextMenu.Item className="ContextMenuItem danger" onClick={() => { character.delete() }}>
                              <MenuItemIcon><FontAwesomeIcon icon={faTrashCan} /></MenuItemIcon>
                              Delete
                            </ContextMenu.Item>

                          </ContextMenu.Content>
                        </ContextMenu.Portal>
                      </ContextMenu.Root>
                    })}
                  </ListGroup>
                </CollapsibleAccordionCard>
              })}


            </div>
          </Accordion>


        </CollapsibleAccordionCard>


        <CollapsibleAccordionCard label='Scenes' headerExtra={
          <SimpleButton label="+" onClick={handleAddScene} />}
          openColor='#3564bc' closedColor='#425484'>
          <div>

            <ListGroup>
              {project.scenes && project.scenes.map((scene, idx) => (
                <SceneListItem key={idx} scene={scene} />
              ))}
            </ListGroup>

          </div>
        </CollapsibleAccordionCard>



        <CollapsibleAccordionCard label='Scripts' headerExtra={
          <SimpleButton label="+" onClick={() => scriptmaster.createScript()} />}
          openColor='#a54797' closedColor='#603858'>
          <div>


            <ListGroup>
              {scriptmaster.children.map((script) => {
                return <ContextMenu.Root key={script.path}>
                  <ContextMenu.Trigger>

                    <li
                      className="d-flex justify-content-between align-items-center py-1 px-2"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        project.setView({ type: "scriptmaster" });
                        project.setSelectedPath(script.path);
                      }}
                      onContextMenu={() => { }}
                      key={script.path}
                    >
                      {/* Scene name */}
                      <span
                        className={project.selectedPath == script.path ? 'text-success' : undefined}
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          minWidth: 0,
                        }}
                      >
                        {(script as LocalFile).name_no_extension}
                      </span>
                    </li>
                  </ContextMenu.Trigger>

                  <ContextMenu.Portal>
                    <ContextMenu.Content className="ContextMenuContent">

                      <ContextMenu.Item className="ContextMenuItem" onClick={() => script.log()}>
                        <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                        Log
                      </ContextMenu.Item>

                      <ContextMenu.Item className="ContextMenuItem danger" onClick={() => { script.delete() }}>
                        <MenuItemIcon><FontAwesomeIcon icon={faTrashCan} /></MenuItemIcon>
                        Delete
                      </ContextMenu.Item>

                    </ContextMenu.Content>
                  </ContextMenu.Portal>


                </ContextMenu.Root>
              })}
            </ListGroup>

          </div>
        </CollapsibleAccordionCard>


      </Accordion>
    </div>
  );
});

export default FolderList;
