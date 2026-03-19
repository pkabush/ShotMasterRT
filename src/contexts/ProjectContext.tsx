
import { createContext, useContext } from "react";
import { Project } from "../classes/Project";

interface ProjectContextType {
  project: Project | null;
}

export const ProjectContext = createContext<ProjectContextType | null>(null);

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) { throw new Error("useProject must be used within ProjectProvider"); }
  return ctx;
};