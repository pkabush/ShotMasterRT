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
import { ModularScript, ScriptMaster } from '../classes/ScriptMaster.ts';

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


            <Accordion style={{ marginLeft: '10px', }}>
              {scriptmaster.children.map((_script) => {

                const script = _script as ModularScript;

                return <ContextMenu.Root key={script.path}>
                  <ContextMenu.Trigger>
                    <CollapsibleAccordionCard label={script.name} key={script.path} onToggle={() => {
                      project.setView({ type: "scriptmaster" });
                      project.setSelectedPath(script.path);
                      project.setSelectedSubPath(``)
                    }}>

                      {/** Episode Lists */}
                      <Accordion style={{ marginLeft: '10px', }}>
                        {Object.entries(script.episodeLists).map(([episodeListName, _]) => {

                          //console.log(episodeListName, script.getEpisodes(episodeListName))
                          return <ContextMenu.Root key={script.path + "#" + episodeListName}>
                            <ContextMenu.Trigger>
                              <CollapsibleAccordionCard label={episodeListName} key={episodeListName} onToggle={() => {
                                project.setView({ type: "scriptmaster" });
                                project.setSelectedPath(script.path);
                                project.setSelectedSubPath(`${episodeListName}`)
                              }}>
                                {/** Episodes */}
                                <Accordion style={{ marginLeft: '10px', }}>
                                  {Object.entries(script.getEpisodes(episodeListName)).map(([episodeName, _]) => {

                                    return <ContextMenu.Root key={`${script.path}"#"${episodeListName}/${episodeName}`}>
                                      <ContextMenu.Trigger>
                                        <CollapsibleAccordionCard label={episodeName} key={episodeName} onToggle={() => {
                                          project.setView({ type: "scriptmaster" });
                                          project.setSelectedPath(script.path);
                                          project.setSelectedSubPath(`${episodeListName}/${episodeName}`)
                                        }}>
                                          {/** SCENES */}
                                          {/**
                                          <Accordion style={{ marginLeft: '10px', }}>
                                            {Object.entries(script.getScenes(episodeListName, episodeName)).map(([sceneName, _]) => {

                                              const path = `${script.path}"#"${episodeListName}/${episodeName}/${sceneName}`;
                                              return <ContextMenu.Root key={path}>
                                                <ContextMenu.Trigger>
                                                  <li
                                                    className="d-flex justify-content-between align-items-center py-1 px-2"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => {
                                                      project.setView({ type: "scriptmaster" });
                                                      project.setSelectedPath(script.path);
                                                      project.setSelectedSubPath(`${episodeListName}/${episodeName}/${sceneName}`)
                                                    }}
                                                    onContextMenu={() => {
                                                      project.setView({ type: "scriptmaster" });
                                                      project.setSelectedPath(script.path);
                                                      project.setSelectedSubPath(`${episodeListName}/${episodeName}/${sceneName}`)
                                                    }}
                                                    key={path}
                                                  >
                                                    <span
                                                      className={project.selectedPath == path ? 'text-success' : undefined}
                                                      style={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        minWidth: 0,
                                                      }}
                                                    >
                                                      {sceneName}
                                                    </span>
                                                  </li>
                                                </ContextMenu.Trigger>


                                                <ContextMenu.Portal>
                                                  <ContextMenu.Content className="ContextMenuContent">

                                                    <ContextMenu.Item className="ContextMenuItem" onClick={() => {
                                                      project.setView({ type: "scriptmaster" });
                                                      project.setSelectedPath(script.path);
                                                      project.setSelectedSubPath(`${episodeListName}/${episodeName}/${sceneName}`)
                                                    }}>
                                                      <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                                      Open Scene
                                                    </ContextMenu.Item>

                                                  </ContextMenu.Content>
                                                </ContextMenu.Portal>

                                              </ContextMenu.Root>
                                            })}

                                          </Accordion>

                                             */}

                                        </CollapsibleAccordionCard>
                                      </ContextMenu.Trigger>

                                      {/** Episode Portal */}

                                      <ContextMenu.Portal>
                                        <ContextMenu.Content className="ContextMenuContent">

                                          <ContextMenu.Item className="ContextMenuItem" onClick={() => {
                                            project.setView({ type: "scriptmaster" });
                                            project.setSelectedPath(script.path);
                                            project.setSelectedSubPath(`${episodeListName}/${episodeName}`)
                                          }}>
                                            <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                            Open Episode
                                          </ContextMenu.Item>

                                        </ContextMenu.Content>
                                      </ContextMenu.Portal>

                                    </ContextMenu.Root>

                                  })}

                                </Accordion>

                              </CollapsibleAccordionCard>
                            </ContextMenu.Trigger>

                            <ContextMenu.Portal>
                              <ContextMenu.Content className="ContextMenuContent">

                                <ContextMenu.Item className="ContextMenuItem" onClick={() => {
                                  project.setView({ type: "scriptmaster" });
                                  project.setSelectedPath(script.path);
                                  project.setSelectedSubPath(`${episodeListName}`)
                                }}>
                                  <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                                  Open Episode List
                                </ContextMenu.Item>

                                <ContextMenu.Item className="ContextMenuItem danger" onClick={() => { }}>
                                  <MenuItemIcon><FontAwesomeIcon icon={faTrashCan} /></MenuItemIcon>
                                  Delete
                                </ContextMenu.Item>

                              </ContextMenu.Content>
                            </ContextMenu.Portal>


                          </ContextMenu.Root>

                        })}


                      </Accordion>
                    </CollapsibleAccordionCard>




                  </ContextMenu.Trigger>

                  <ContextMenu.Portal>
                    <ContextMenu.Content className="ContextMenuContent">

                      <ContextMenu.Item className="ContextMenuItem" onClick={() => {
                        project.setView({ type: "scriptmaster" });
                        project.setSelectedPath(script.path);
                        project.setSelectedSubPath("")
                      }}>
                        <MenuItemIcon><FontAwesomeIcon icon={faClipboard} /></MenuItemIcon>
                        Open
                      </ContextMenu.Item>


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
            </Accordion>

          </div>
        </CollapsibleAccordionCard>


      </Accordion>
    </div>
  );
});

export default FolderList;
