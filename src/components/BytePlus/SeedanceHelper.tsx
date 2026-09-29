import type React from "react"
import { EditableJsonToggleField } from "../EditableJsonTextField"
import { Project } from "../../classes/Project"



export const SeedanceSendImagesToggle: React.FC = () => {
    return <EditableJsonToggleField 
    field="global_settings/seedance_send_images" 
    localJson={Project.getProject().projinfo} 
    default_val={false} 
    label="Seedance: Upload Images To Storage (use with caution, if you're getting error 524)" />
}

export const getSeedanceSendImages = () => {
    return Project.getProject().projinfo?.getField("global_settings/seedance_send_images") ?? false;
}