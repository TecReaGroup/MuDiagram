import '../styles.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { queryClient } from '../shared/api/query-client';
import { LanguageProvider } from '../shared/i18n/language-context';
import { LibraryLayout } from '../pages/library/LibraryLayout';
import { ProjectListPage } from '../pages/library/ProjectListPage';
import { TrashPage } from '../pages/trash/TrashPage';

// Safari has no requestIdleCallback; a short delay still keeps warm-up off the first paint.
const IDLE_FALLBACK_DELAY_MS = 1500;

// The editor carries draw.io glue and the AI SDK, which the library never needs.
const loadEditorPage = () => import('../pages/editor/EditorPage').then(module => ({ Component: module.EditorPage }));

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
  { path: '/project/:projectId', lazy: loadEditorPage },
]);

function runWhenIdle(task: () => void) {
  if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(task);
  else window.setTimeout(task, IDLE_FALLBACK_DELAY_MS);
}

/** Opening a project is the next step from anywhere, so its code is fetched and draw.io started once the page is idle. */
function useEditorWarmUp() {
  useEffect(() => runWhenIdle(() => {
    void loadEditorPage();
    // Dynamic, so the frame code lands in the chunk the editor page shares instead of the library bundle.
    void import('../features/diagram-editor/drawio-editor-frame').then(module => module.warmUpDrawioEditor());
  }), []);
}

export function App() {
  useEditorWarmUp();
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <RouterProvider router={router} />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
