import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import lunr from 'lunr';
import { hasGitHubToken } from '../src/lib/github.service';
import { readReposConfig, RepoConfig } from '../src/lib/config';
import { fetchReadme, getRepoContext } from '../src/lib/repo.service';
import { collectSkillsFromRemote, SkillDoc } from '../src/lib/skill.service';

interface RepoJson {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
}

const ROOT = process.cwd();
const CONTENT_SKILLS = path.join(ROOT, 'src/content/skills');
const CONTENT_REPOS = path.join(ROOT, 'src/content/repos');
const DATA_DIR = path.join(ROOT, 'src/data');
const PUBLIC_DIR = path.join(ROOT, 'public');

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const clean: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) clean[key] = value;
  });
  return clean as Partial<T>;
}

function writeRepoContent(repo: RepoConfig, readme: string, branch: string): void {
  const frontmatter = compact({
    id: repo.id,
    name: repo.name,
    description: repo.description || '',
    tags: repo.tags || [],
    repoUrl: repo.repoUrl,
    defaultBranch: branch
  });

  const markdown = matter.stringify(readme, frontmatter);
  const dest = path.join(CONTENT_REPOS, repo.id, 'index.md');
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, markdown);
}

function writeSkillContent(skill: SkillDoc): void {
  const frontmatter = compact({
    id: skill.id,
    name: skill.id,
    title: skill.title,
    description: skill.description,
    version: skill.version,
    tags: skill.tags,
    frameworks: skill.frameworks,
    testTypes: skill.testTypes,
    level: skill.level,
    status: skill.status,
    estimatedTime: skill.estimatedTime,
    hasExamples: skill.hasExamples,
    hasTemplates: skill.hasTemplates,
    hasEvals: skill.hasEvals,
    hasScripts: skill.hasScripts,
    recommendedCommands: skill.recommendedCommands,
    repoId: skill.repoId,
    repoName: skill.repoName
  });

  const markdown = matter.stringify(skill.content, frontmatter);
  const dest = path.join(CONTENT_SKILLS, `${skill.id}.md`);
  ensureDir(path.dirname(dest));
  fs.writeFileSync(dest, markdown);
}

function buildSearchIndex(documents: SkillDoc[]) {
  if (!documents.length) {
    return { index: null, documents: [] };
  }

  const idx = lunr(function (this: lunr.Builder) {
    this.ref('id');
    this.field('title');
    this.field('description');
    this.field('tags');
    this.field('repoName');

    documents.forEach((doc) => this.add(doc));
  });

  return { index: idx.toJSON(), documents };
}

async function processRepo(repo: RepoConfig): Promise<{ repoJson: RepoJson | null; skills: SkillDoc[]; ok: boolean }> {
  try {
    const context = await getRepoContext(repo);
    if (!context) {
      console.error(`[aggregate:${repo.id}] No se pudo obtener metadata del repositorio.`);
      return { repoJson: null, skills: [], ok: false };
    }

    const readme =
      (await fetchReadme(repo, context)) ||
      '# README no encontrado\nActualiza readmePath en config/repos.yaml.';

    writeRepoContent(repo, readme, context.defaultBranch);

    const skills = await collectSkillsFromRemote(repo);
    for (const skill of skills) {
      writeSkillContent(skill);
    }

    console.log(
      `[aggregate:${repo.id}] branch=${context.defaultBranch} private=${context.isPrivate} skills=${skills.length}`
    );

    return {
      repoJson: {
        id: repo.id,
        name: repo.name,
        description: repo.description || '',
        tags: repo.tags || [],
        url: `/repos/${repo.id}/`
      },
      skills,
      ok: true
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error(`[aggregate:${repo.id}] Error procesando repo: ${message}`);
    return { repoJson: null, skills: [], ok: false };
  }
}

async function main(): Promise<void> {
  ensureDir(CONTENT_SKILLS);
  ensureDir(CONTENT_REPOS);
  ensureDir(DATA_DIR);
  ensureDir(PUBLIC_DIR);

  if (!hasGitHubToken()) {
    console.warn('WARN: No se definio GITHUB_TOKEN/GITHUB_PAT; los repos privados pueden fallar.');
  }

  const repos = await readReposConfig();
  if (!repos.length) {
    throw new Error('No hay repos configurados en la base de datos');
  }

  const allSkills: SkillDoc[] = [];
  const repoData: RepoJson[] = [];
  let failedRepos = 0;

  for (const repo of repos) {
    const result = await processRepo(repo);
    if (!result.ok) {
      failedRepos += 1;
      continue;
    }

    if (result.repoJson) {
      repoData.push(result.repoJson);
    }

    allSkills.push(...result.skills);
  }

  fs.writeFileSync(path.join(DATA_DIR, 'skills.json'), JSON.stringify(allSkills, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'repos.json'), JSON.stringify(repoData, null, 2));

  const searchIndex = buildSearchIndex(allSkills);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(searchIndex, null, 2));

  console.log(`Repos procesados OK: ${repoData.length}`);
  console.log(`Repos con error: ${failedRepos}`);
  console.log(`Skills procesadas: ${allSkills.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
