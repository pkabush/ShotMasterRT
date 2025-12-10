import React, { createContext, useContext, useState } from "react";
import type {ReactNode} from "react";

interface ContentContextType {
  contentArea: React.JSX.Element | null;
  setContentArea: (content: React.JSX.Element | null) => void;
  rootFolder: FileSystemDirectoryHandle | null;
  setRootFolder: (folder: FileSystemDirectoryHandle | null) => void;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

interface ContentProviderProps {
  children: ReactNode;
}

export const ContentProvider: React.FC<ContentProviderProps> = ({ children }) => {
  const [contentArea, setContentArea] = useState<React.JSX.Element | null>(null);
  const [rootFolder, setRootFolder] = useState<FileSystemDirectoryHandle | null>(null);

  return (
    <ContentContext.Provider value={{ contentArea, setContentArea, rootFolder, setRootFolder }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = (): ContentContextType => {
  const context = useContext(ContentContext);
  if (!context) throw new Error("useContent must be used within a ContentProvider");
  return context;
};
