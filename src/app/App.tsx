import '../styles.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LanguageProvider } from '../shared/i18n/language-context';
import { EditorPage } from '../pages/editor/EditorPage';
import { LibraryLayout } from '../pages/library/LibraryLayout';
import { ProjectListPage } from '../pages/library/ProjectListPage';
import { TrashPage } from '../pages/trash/TrashPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LibraryLayout />,
    children: [
      { index: true, element: <ProjectListPage /> },
      { path: 'folder/:folderId', element: <ProjectListPage /> },
      { path: 'trash', element: <TrashPage /> },
    ],
  },
  { path: '/project/:projectId', element: <EditorPage /> },]);

export function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}
