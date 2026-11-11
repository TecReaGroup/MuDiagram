import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedProject, sharedDiagramUrl, type SharedProject } from '../../entities/project/project-api';
import { BrandMark } from '../../shared/ui/BrandMark';
import { OUTLINE_BUTTON_CLASS } from '../../shared/ui/control-class';

export function SharePage() {
  const { shareToken = '' } = useParams();
  const [sharedProject, setSharedProject] = useState<SharedProject | null>(null);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    getSharedProject(shareToken).then(setSharedProject, () => setIsMissing(true));
  }, [shareToken]);

  if (isMissing) return <p className="p-6 text-[13px] text-muted-foreground">分享链接不存在或已关闭。</p>;
  if (!sharedProject) return <p className="p-6 text-[13px] text-muted-foreground">加载中…</p>;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="m-3 mb-0 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card py-2 pr-2 pl-3 shadow-float">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em]">{sharedProject.name}</h1>
            <div className="text-xs text-faint">更新于 {new Date(sharedProject.updatedAt).toLocaleString()}</div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <a href={sharedDiagramUrl(shareToken, 'drawio')} className={OUTLINE_BUTTON_CLASS}>下载 .drawio</a>
          <a href={sharedDiagramUrl(shareToken, 'svg')} download className={OUTLINE_BUTTON_CLASS}>SVG</a>
          <a href={sharedDiagramUrl(shareToken, 'png')} download className={OUTLINE_BUTTON_CLASS}>PNG</a>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <img src={sharedDiagramUrl(shareToken, 'svg')} alt={sharedProject.name} className="max-h-full max-w-full rounded-2xl bg-white p-6 shadow-float" />
      </main>
    </div>
  );
}
