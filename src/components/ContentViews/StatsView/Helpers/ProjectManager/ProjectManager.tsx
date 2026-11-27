
import { useEffect, useState } from 'react';
import { Button, Card, Form, Spinner } from 'react-bootstrap';
import { observer } from 'mobx-react-lite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faRefresh,
    faPlus,
    faTrash,
    faUserPlus,
    faXmark
} from '@fortawesome/free-solid-svg-icons';

import {
    getFromWorker,
    postToWorker,
    deleteFromWorker
} from '../../../../../classes/CloudflareWorker/WorkerUtils';

interface ProjectData {
    name: string;
    users: string[];
}


export const ProjectManager = observer(() => {
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [users, setUsers] = useState<string[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const fetchProjects = async () => {
        setLoading(true);

        try {
            const res = await getFromWorker('stats/projects');
            console.log(res);
            setProjects(res.data.projects);
            setUsers(res.data.users);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    const deleteProject = async (name: string) => {
        if (!window.confirm(`Delete project "${name}" and all its assignments?`)) {
            return;
        }

        try {
            await deleteFromWorker(`stats/projects/${encodeURIComponent(name)}`);
            await fetchProjects();
        } catch (err) {
            console.error('Failed to delete project:', err);
        }
    };

    const addUser = async (projectName: string) => {
        const email = selectedUsers[projectName];
        if (!email) return;

        try {
            await postToWorker({ email }, `stats/projects/${encodeURIComponent(projectName)}/users`,);

            setSelectedUsers(prev => ({
                ...prev,
                [projectName]: ''
            }));

            await fetchProjects();
        } catch (err) {
            console.error('Failed to assign user:', err);
        }
    };

    const removeUser = async (projectName: string, email: string) => {
        try {
            await deleteFromWorker(
                `stats/projects/${encodeURIComponent(projectName)}/users/${encodeURIComponent(email)}`
            );

            await fetchProjects();
        } catch (err) {
            console.error('Failed to remove user:', err);
        }
    };

    return (
        <div className="d-flex flex-column gap-3">

            {/* Header */}
            <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Project Management</h5>



                <Button
                    onClick={fetchProjects}
                    size="sm"
                    variant="outline-secondary"
                    disabled={loading}
                >
                    <FontAwesomeIcon
                        icon={faRefresh}
                        spin={loading}
                    />
                </Button>
            </div>

            {/* Add project */}
            <Button
                variant="success"
                size="sm"
                className="align-self-start"
                onClick={() => {
                    const name = window.prompt('Enter project name:');
                    if (name?.trim()) {
                        postToWorker({ name: name.trim() }, 'stats/projects')
                            .then(fetchProjects)
                            .catch(err => console.error('Failed to create project:', err));
                    }
                }}
            >
                <FontAwesomeIcon icon={faPlus} className="me-2" />
                Add project
            </Button>


            {/* Projects */}
            {loading && projects.length === 0 ? (
                <div className="text-center p-4">
                    <Spinner animation="border" size="sm" />
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {projects.map(project => {
                        const availableUsers = users.filter(
                            email => !project.users.includes(email)
                        );

                        return (
                            <Card key={project.name}>
                                <Card.Body>
                                    {/* Project header */}
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <div>
                                            <h6 className="mb-1">
                                                {project.name}
                                            </h6>
                                            <small className="text-muted">
                                                {project.users.length} assigned users
                                            </small>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline-danger"
                                            onClick={() => deleteProject(project.name)}
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </Button>
                                    </div>

                                    {/* Assigned users */}
                                    <div className="d-flex flex-column gap-2 mb-3">
                                        {project.users.length === 0 ? (
                                            <small className="text-muted">
                                                No users assigned
                                            </small>
                                        ) : (
                                            project.users.map(email => (
                                                <div
                                                    key={email}
                                                    className="d-flex justify-content-between align-items-center border rounded px-3 py-2"
                                                >
                                                    <span>{email}</span>

                                                    <Button
                                                        size="sm"
                                                        variant="outline-danger"
                                                        onClick={() => removeUser(project.name, email)}
                                                    >
                                                        <FontAwesomeIcon icon={faXmark} />
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Add user */}
                                    <div className="d-flex gap-2">
                                        <Form.Select
                                            size="sm"
                                            value={selectedUsers[project.name] || ''}
                                            onChange={e => setSelectedUsers(prev => ({
                                                ...prev,
                                                [project.name]: e.target.value
                                            }))}
                                        >
                                            <option value="">
                                                Select user...
                                            </option>

                                            {availableUsers.map(email => (
                                                <option key={email} value={email}>
                                                    {email}
                                                </option>
                                            ))}
                                        </Form.Select>

                                        <Button
                                            size="sm"
                                            variant="outline-primary"
                                            disabled={!selectedUsers[project.name]}
                                            onClick={() => addUser(project.name)}
                                        >
                                            <FontAwesomeIcon icon={faUserPlus} />
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        );
                    })}

                    {!loading && projects.length === 0 && (
                        <div className="text-center text-muted p-4">
                            No projects found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
