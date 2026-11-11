// A prompt typed before the project exists travels to the editor in router state.

const PROJECT_NAME_MAX_LENGTH = 40;

export type InitialPromptState = { initialPrompt: string };

export function createInitialPromptState(prompt: string): InitialPromptState {
  return { initialPrompt: prompt };
}

export function readInitialPrompt(routerState: unknown): string | undefined {
  const prompt = (routerState as Partial<InitialPromptState> | null)?.initialPrompt;
  return typeof prompt === 'string' && prompt.trim() ? prompt : undefined;
}

export function projectNameFromPrompt(prompt: string): string {
  const firstLine = prompt.trim().split('\n')[0];
  return firstLine.length > PROJECT_NAME_MAX_LENGTH ? `${firstLine.slice(0, PROJECT_NAME_MAX_LENGTH)}…` : firstLine;
}
