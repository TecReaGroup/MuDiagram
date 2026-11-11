import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectCard } from '../../features/project-library/ProjectCard';
import { useProjectLibrary } from '../../features/project-library/use-project-library';

export function LibraryPage() {
  const navigate = useNavigate();
  const { projects, failure, create, rename, remove } = useProjectLibrary();
  const [newProjectName, setNewProjectName] = useState('');

  async function createAndOpen(event: FormEvent) {
    event.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    const project = await create(name);
    if (project) navigate(`/project/${project.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-800">MuDiagram <span className="font-normal text-slate-400">Library</span></h1>
          <form onSubmit={event => void createAndOpen(event)} className="flex gap-2">
            <input
              value={newProjectName}
              onChange={event => setNewProjectName(event.target.value)}
              placeholder="新项目名称"
              maxLength={120}
              className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-sky-500"
            />
            <button type="submit" disabled={!newProjectName.trim()} className="rounded-md bg-sky-600 px-3 py-1.5 text-sm text-white hover:bg-sky-700 disabled:opacity-40">新建项目</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">
        {failure && <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-600">{failure}</p>}
        {projects === null && !failure && <p className="text-sm text-slate-400">加载中…</p>}
        {projects?.length === 0 && <p className="text-sm text-slate-400">还没有项目，先新建一个吧。</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects?.map(project => (
            <ProjectCard key={project.id} project={project} onRename={(target, name) => void rename(target, name)} onDelete={target => void remove(target)} />
          ))}
        </div>
      </main>
    </div>
  );
}
