import { finalApprovalIssues } from "./story";
import type { SpeechProject } from "./speech";
import type { Ownership } from "./ownership";
import { reviewedFixtureImage } from "./image-pack";

export function publicationIssues(project: SpeechProject, ownership: Ownership): string[] {
  // M6 permits a reviewed bilingual text-only edition. The M4 freeze still requires all 24 clips.
  const story = { ...project.story, ...ownership };
  const issues = finalApprovalIssues(story, { requireAudio: false });
  if (project.mode !== "real") issues.unshift("Mock rehearsals cannot become approved publications.");
  for (const page of story.pages) {
    if (!reviewedFixtureImage(page.illustrationAssetId)) issues.push(`Page ${page.number}: exportable reviewed image is missing.`);
    for (const language of ["en", "st"] as const) {
      const script = project.scripts.find(value => value.id === `${language}-page-0${page.number}`);
      const expected = language === "en" ? page.narrative : page.translation?.text;
      if (!script || script.status !== "approved" || script.text !== expected) issues.push(`Page ${page.number}: review the current ${language} script in StoriSpeak.`);
    }
  }
  return issues;
}
