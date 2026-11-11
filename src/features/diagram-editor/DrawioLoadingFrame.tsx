import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '../../shared/i18n/language-context';

/**
 * Keeps a draw.io iframe invisible until it reports `load`, showing our own loader instead.
 *
 * NOTE: Until its theme configuration applies, draw.io paints a white page with its own
 * "Loading..." block; hiding the iframe with opacity (not `display: none`) lets it still lay out.
 */
export function DrawioLoadingFrame({ isLoaded, children }: { isLoaded: boolean; children: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="relative size-full">
      <div className={`size-full transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </div>
      {!isLoaded && (
        <div className="absolute inset-0 flex animate-fade-in items-center justify-center gap-2 text-sm text-ink-faint">
          <LoaderCircle className="size-4 animate-spin" />
          {t('editor.loading')}
        </div>
      )}
    </div>
  );
}
