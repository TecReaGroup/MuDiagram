import { projectPreviewUrl, type Project } from '../../entities/project/project-api';
import { DiagramSketch } from './DiagramSketch';

export function ProjectPreview({ project }: { project: Project }) {
  const previewUrl = projectPreviewUrl(project);

  return previewUrl ? (
    <img src={previewUrl} alt="" className="max-h-full max-w-full object-contain p-4" />
  ) : (
    <DiagramSketch seed={project.id} />
  );
}
