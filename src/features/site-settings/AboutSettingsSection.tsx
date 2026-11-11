import { BrandMark } from '../../shared/ui/BrandMark';

export function AboutSettingsSection() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line px-4 py-4">
      <BrandMark className="size-11" />
      <div>
        <div className="text-[15px] font-semibold tracking-[-0.02em]">MuDiagram</div>
        <div className="text-[13px] text-ink-muted">用一句话生成可编辑的 draw.io 架构图</div>
      </div>
    </div>
  );
}
