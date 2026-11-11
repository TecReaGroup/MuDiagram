import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedProject, sharedDiagramUrl, type SharedProject } from '../../entities/project/project-api';

export function SharePage() {
  const { shareToken = '' } = useParams();
  const [sharedProject, setSharedProject] = useState<SharedProject | null>(null);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    getSharedProject(shareToken).then(setSharedProject, () => setIsMissing(true));
  }, [shareToken]);

  if (isMissing) return <p className="p-6 text-sm text-slate-500">分享链接不存在或已关闭。</p>;
  if (!sharedProject) return <p className="p-6 text-sm text-slate-400">加载中…</p>;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <h1 className="text-base font-semibold text-slate-800">{sharedProject.name}</h1>
          <div className="text-xs text-slate-400">更新于 {new Date(sharedProject.updatedAt).toLocaleString()}</div>
        </div>
        <div className="flex gap-2 text-sm">
          <a href={sharedDiagramUrl(shareToken, 'drawio')} className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">下载 .drawio</a>
          <a href={sharedDiagramUrl(shareToken, 'svg')} download className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">SVG</a>
          <a href={sharedDiagramUrl(shareToken, 'png')} download className="rounded-md border border-slate-300 px-3 py-1 hover:bg-slate-50">PNG</a>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <img src={sharedDiagramUrl(shareToken, 'svg')} alt={sharedProject.name} className="max-h-full max-w-full rounded-lg bg-white p-4 shadow-sm" />
      </main>
    </div>
  );
}
