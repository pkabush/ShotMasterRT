import React from "react";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import { AccordionCard } from "../Containers/AccordionCard";
import { LocalFolder } from "../../classes/fileSystem/LocalFolder";
import { observer } from "mobx-react-lite";
import { Form, ListGroup, Stack } from "react-bootstrap";
import { FolderDropdownNode } from "./FolderDropdown";
import { Project } from "../../classes/Project";
import { MediaPreviewSmall } from "../MediaComponents/MediaPreviewSmall";
import { LocalMedia } from "../../classes/fileSystem/LocalMedia";
import type { Tags } from "../../classes/Tags";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp, faImages, faTrashCan } from "@fortawesome/free-solid-svg-icons";

interface TagsContainerProps {
    tags: Tags | null;
    folders?: LocalFolder[];
}

// Wrap the component with observer
export const TagsFolderContainer: React.FC<TagsContainerProps> = observer(({
    tags,
    folders = [],
}) => {
    if (!tags) return null;

    const project = Project.getProject();

    return (
        <Accordion defaultActiveKey="TAGS" className="mb-2">
            <AccordionCard eventKey="TAGS">
                <AccordionCard.Header closedColor="#544228" openColor="#a97428">
                    <>
                        References
                        <FontAwesomeIcon icon={faImages} className="mx-2" style={{
                            color: '#e2eb3a',
                        }} />
                    </>
                    <AccordionCard.Controls>
                        <Stack direction="horizontal" gap={3}>
                            <Form.Switch label="Use Refs" checked={tags.use_tags} onChange={(e) => { tags.use_tags = e.target.checked }} />
                            <Button size="sm" variant="outline-secondary" onClick={() => tags.log()}>
                                LOG
                            </Button>
                        </Stack>
                    </AccordionCard.Controls>

                </AccordionCard.Header>
                <AccordionCard.Body>
                    {tags.use_tags ?
                        <ListGroup>
                            <ListGroup.Item key={tags.owner.path} className="py-0 px-0">
                                <Stack direction="horizontal" gap={2}>
                                    {folders.map((local_folder) => (
                                        <FolderDropdownNode
                                            key={local_folder.path}
                                            folder={local_folder}
                                            selected_paths={tags.tags}
                                            onSelect={(item) => {
                                                if (item instanceof LocalMedia) {
                                                    tags.addTag(item, true)
                                                }
                                            }} />)
                                    )}

                                    <Form.Switch
                                        label="Use Parent Tags"
                                        checked={tags.use_parent_tags}
                                        className="ms-auto"
                                        onChange={(e) => { tags.use_parent_tags = e.target.checked }} />
                                    <Button
                                        size="sm"
                                        variant="outline-warning"
                                        onClick={async () => tags.importFromClipboard() }
                                    >
                                        Paste Tag
                                    </Button>
                                </Stack>
                            </ListGroup.Item>

                            {tags.tags.map((tag: string) => {
                                const media = project.getByAbsPath(tag, LocalMedia);
                                const active = tags.isActive(tag);

                                return <ListGroup.Item key={tag} className="py-0 px-0">
                                    <Stack direction="horizontal" gap={0}>
                                        <div
                                            className={`rounded-circle mx-2 ${active ? 'bg-success' : 'border border-secondary'}`}
                                            style={{ width: '15px', height: '15px', }}
                                            onClick={() => {
                                                tags.toggle(tag);
                                            }}
                                        />
                                        {
                                            (!media) ? <>{tag}</> : <MediaPreviewSmall media={media} />
                                        }

                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            onClick={() => tags.moveTag(tag, -1)}
                                            className="ms-auto">
                                            <FontAwesomeIcon icon={faArrowUp} />
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline-secondary"
                                            onClick={() => tags.moveTag(tag, 1)}
                                        >
                                            <FontAwesomeIcon icon={faArrowDown} />
                                        </Button>


                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            className="ms-3"
                                            onClick={() => tags.deleteTag(tag)}>
                                            <FontAwesomeIcon icon={faTrashCan} />
                                        </Button>

                                    </Stack>
                                </ListGroup.Item>;
                            })}



                            {
                                tags.parent_tags.map((tag: string) => {
                                    const media = project.getByAbsPath(tag, LocalMedia);
                                    const active = tags.isActive(tag);

                                    return <ListGroup.Item key={tag} className="py-0 px-0">
                                        <Stack direction="horizontal" gap={0}>
                                            <div
                                                className={`rounded-circle mx-2 ${active ? 'bg-warning' : 'border border-warning'}`}
                                                style={{ width: '15px', height: '15px', }}
                                                onClick={() => {
                                                    tags.toggle(tag);
                                                }}
                                            />
                                            {
                                                (!media) ?
                                                    <>{tag}</> :
                                                    <MediaPreviewSmall media={media} />
                                            }

                                            <Button
                                                size="sm"
                                                variant="outline-warning"
                                                className="ms-auto"
                                                onClick={() => { tags.addTag(tag) }}>
                                                Add
                                            </Button>
                                        </Stack>
                                    </ListGroup.Item>;
                                })}


                        </ListGroup>
                        :
                        <>Tags Are Toggled Off</>
                    }
                </AccordionCard.Body>


            </AccordionCard>
        </Accordion>
    );
});




