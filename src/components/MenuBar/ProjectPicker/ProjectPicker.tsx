
import { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { observer } from 'mobx-react-lite';
import { getFromWorker } from '../../../classes/CloudflareWorker/WorkerUtils';
import { Project } from '../../../classes/Project';
import { EditableJsonOptionSelect } from '../../EditableJsonTextField';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';


interface ProjectPickerProps {
    project: Project;
}


export const ProjectPicker = observer(({ project }: ProjectPickerProps) => {
    const [projects, setProjects] = useState<string[]>([]);

    const fetchProjects = async () => {
        try {
            const res = await getFromWorker('projects');
            console.log("Got project list", res.data);
            setProjects(res.data);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    return (

        <div className="d-flex justify-content-end align-items-center">
            <EditableJsonOptionSelect
                field='canoe_project_name'
                localJson={project.projinfo}
                default_val='personal'
                values={["personal", ...projects]}
            />

            <Button onClick={fetchProjects} size="sm" variant="outline-secondary">
                <FontAwesomeIcon icon={faRefresh} />
            </Button>
        </div>

    );
});
