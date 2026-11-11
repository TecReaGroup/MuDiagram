import { useState } from 'react';
import { projectPreviewUrl, type Project } from '../../entities/project/project-api';
import { DiagramSketch } from './DiagramSketch';

export function ProjectPreview({ project }: { project: Project }) {
  // A project never saved from the editor has no SVG yet; fall back to the sketch.
  const [hasPreview, setHasPreview] = useState(true);

  return hasPreview ? (
    <img src={projectPreviewUrl(project)} alt="" onError={() => setHasPreview(false)} className="max-h-full max-w-full object-contain p-4" />
  ) : (
    <DiagramSketch seed={project.id} />
  );
}
