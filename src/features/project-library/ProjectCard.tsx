import { useState } from 'react';
import { Link } from 'react-router-dom';
import { projectDiagramUrl, type Project } from '../../entities/project/project-api';

type ProjectCardProps = {
  project: Project;
  onRename: (project: Project, name: string) => void;
  onDelete: (project: Project) => void;
};

export function ProjectCard({ project, onRename, onDelete }: ProjectCardProps) {
  const [hasPreview, setHasPreview] = useState(true);

  function promptRename() {
    const name = window.prompt('重命名项目', project.name)?.trim();
    if (name && name !== project.name) onRename(project, name);
  }

  function confirmDelete() {
    if (window.confirm(`删除项目「${project.name}」？此操作无法撤销。`)) onDelete(project);
  }

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <Link to={`/project/${project.id}`} className="flex h-40 items-center justify-center bg-slate-50">
        {hasPreview ? (
          <img
            src={projectDiagramUrl(project.id, 'svg', project.updatedAt)}
            alt={project.name}
            onError={() => setHasPreview(false)}
            className="max-h-full max-w-full object-contain p-3"
          />
        ) : (
          <span className="text-xs text-slate-400">空白图表</span>
        )}
      </Link>
      <div className="flex items-start justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          <Link to={`/project/${project.id}`} className="block truncate text-sm font-medium text-slate-800 hover:text-sky-700">{project.name}</Link>
          <div className="text-xs text-slate-400">
            {new Date(project.updatedAt).toLocaleString()}
            {project.shareToken && <span className="ml-2 rounded bg-emerald-50 px-1.5 text-emerald-600">已分享</span>}
          </div>
        </div>
        <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
          <button type="button" onClick={promptRename} className="rounded px-1.5 text-xs text-slate-500 hover:bg-slate-100">重命名</button>
          <button type="button" onClick={confirmDelete} className="rounded px-1.5 text-xs text-rose-500 hover:bg-rose-50">删除</button>
        </div>
      </div>
    </article>
  );
}
