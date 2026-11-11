import '../styles.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { EditorPage } from '../pages/editor/EditorPage';
import { LibraryLayout } from '../pages/library/LibraryLayout';
import { ProjectListPage } from '../pages/library/ProjectListPage';
import { SharePage } from '../pages/share/SharePage';
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
  { path: '/project/:projectId', element: <EditorPage /> },
  { path: '/share/:shareToken', element: <SharePage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
