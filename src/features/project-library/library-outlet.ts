import { useOutletContext } from 'react-router-dom';
import type { ProjectLibrary } from './use-project-library';

/** What the library layout hands to its child pages (all projects, a folder, the trash). */
export type LibraryOutletContext = {
  library: ProjectLibrary;
  searchText: string;
};

export const useLibraryOutlet = () => useOutletContext<LibraryOutletContext>();
