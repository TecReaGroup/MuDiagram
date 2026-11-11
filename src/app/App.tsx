import '../styles.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { EditorPage } from '../pages/editor/EditorPage';
import { LibraryPage } from '../pages/library/LibraryPage';
import { SharePage } from '../pages/share/SharePage';

const router = createBrowserRouter([
  { path: '/', element: <LibraryPage /> },
  // TODO: give trash and folders their own filtered views once the backend stores them.
  { path: '/trash', element: <LibraryPage /> },
  { path: '/folder/:folderId', element: <LibraryPage /> },
  { path: '/project/:projectId', element: <EditorPage /> },
  { path: '/share/:shareToken', element: <SharePage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
