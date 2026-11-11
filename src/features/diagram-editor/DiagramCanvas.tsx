import { DrawIoEmbed } from 'react-drawio';

const EDITOR_URL_PARAMETERS = {
  ui: 'kennedy',
  spin: true,
  libraries: true,
  noExitBtn: true,
  saveAndExit: false,
} as const;

export function DiagramCanvas() {
  return <DrawIoEmbed urlParameters={EDITOR_URL_PARAMETERS} />;
}
