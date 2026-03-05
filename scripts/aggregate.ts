import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import YAML from 'yaml';
import lunr from 'lunr';

interface RepoConfig {
  id: string;
  name: string;
  description?: string;
  repoUrl: string;
  defaultBranch?: string;
  readmePath?: string;
  skillsPath?: string;
  tags?: string[];
}

interface SkillDoc {
  id: string;
  title: string;
  description: string;
  tags: string[];
  repoId: string;
  repoName: string;
  url: string;
  content: string;
}

interface RepoJson {
  id: string;
  name: string;
  description: string;
  tags: string[];
  url: string;
}

const ROOT = process.cwd();
const CONFIG_PATH = path.join(ROOT, 'config/repos.yaml');
const CONTENT_SKILLS = path.join(ROOT, 'src/content/skills');
const CONTENT_REPOS = path.join(ROOT, 'src/content/repos');
const DATA_DIR = path.join(ROOT, 'src/data');
const PUBLIC_DIR = path.join(ROOT, 'public');
const TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || '';

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function parseRepoSlug(repoUrl: string): { owner: string; name: string } | null {
  const sshMatch = repoUrl.match(/github\.com:([^/]+)\/(.+?)(\.git)?$/);
  if (sshMatch) return { owner: sshMatch[1], name: sshMatch[2].replace(/\.git$/, '') };
  const httpsMatch = repoUrl.match(/github\.com\/([^/]+)\/(.+?)(\.git)?/);
  if (httpsMatch) return { owner: httpsMatch[1], name: httpsMatch[2].replace(/\.git$/, '') };
  return null;
}

async function fetchText(url: string, accept = 'application/vnd.github.raw'): Promise<string | null> {
  const headers: Record<string, string> = { Accept: accept };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return await res.text();
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function fetchReadmeApi(repo: RepoConfig): Promise<string | null> {
  const slug = parseRepoSlug(repo.repoUrl);
  if (!slug) return null;
  const branch = repo.defaultBranch || 'main';
  const url = `https://api.github.com/repos/${slug.owner}/${slug.name}/readme?ref=${branch}`;
  const json = await fetchJson<{ content: string; encoding: string }>(url);
  if (!json || json.encoding !== 'base64' || !json.content) return null;
  return Buffer.from(json.content, 'base64').toString('utf8');
}

async function fetchReadmeRaw(repo: RepoConfig): Promise<string | null> {
  const slug = parseRepoSlug(repo.repoUrl);
  if (!slug) return null;
  const branch = repo.defaultBranch || 'main';
  const readmePath = repo.readmePath || 'README.md';
  const url = `https://raw.githubusercontent.com/${slug.owner}/${slug.name}/${branch}/${readmePath}`;
  return fetchText(url);
}

function compact<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const clean: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) clean[key] = value;
  });
  return clean as Partial<T>;
}

function safeSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'skill';
}

function readConfig(): RepoConfig[] {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`No se encontró ${CONFIG_PATH}`);
  }
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  const parsed = YAML.parse(raw);
  return Array.isArray(parsed?.repos) ? parsed.repos : [];
}

async function listSkillFiles(repo: RepoConfig): Promise<string[]> {
  const slug = parseRepoSlug(repo.repoUrl);
  if (!slug) return [];
  const branch = repo.defaultBranch || 'main';
  const skillsPath = repo.skillsPath || 'skills';
  const apiUrl = (p: string) => `https://api.github.com/repos/${slug.owner}/${slug.name}/contents/${p}?ref=${branch}`;

  async function walk(pathSegment: string): Promise<string[]> {
    const entries = await fetchJson<Array<{ path: string; type: string; name: string }>>(apiUrl(pathSegment));
    if (!entries) return [];
    const collected: string[] = [];
    for (const entry of entries) {
      if (entry.type === 'file' && entry.name.toLowerCase() === 'skill.md') {
        collected.push(entry.path);
      } else if (entry.type === 'dir') {
        const nested = await walk(entry.path);
        collected.push(...nested);
      }
    }
    return collected;
  }

  return walk(skillsPath);
}

async function fetchSkillFile(repo: RepoConfig, filePath: string): Promise<string | null> {
  const slug = parseRepoSlug(repo.repoUrl);
  if (!slug) return null;
  const branch = repo.defaultBranch || 'main';
  const url = `https://raw.githubusercontent.com/${slug.owner}/${slug.name}/${branch}/${filePath}`;
  return fetchText(url);
}

async function collectSkillsFromRemote(repo: RepoConfig) {
  const files = await listSkillFiles(repo);
  const skills: SkillDoc[] = [];

  for (const filePath of files) {
    const raw = await fetchSkillFile(repo, filePath);
    if (!raw) continue;
    const parsed = matter(raw);
    const slug = safeSlug(parsed.data?.name || path.basename(path.dirname(filePath)) || path.basename(filePath));
    const frontmatter = compact({
      name: parsed.data?.name || slug,
      title: parsed.data?.title || slug,
      description: parsed.data?.description || 'Descripción pendiente',
      version: parsed.data?.version,
      tags: parsed.data?.tags || [],
      repoId: repo.id,
      repoName: repo.name
    });

    const markdown = matter.stringify(parsed.content, frontmatter);
    const dest = path.join(CONTENT_SKILLS, `${slug}.md`);
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, markdown);

    skills.push({
      id: slug,
      title: frontmatter.title,
      description: frontmatter.description,
      tags: frontmatter.tags,
      repoId: repo.id,
      repoName: repo.name,
      url: `/skills/${slug}`,
      content: parsed.content
    });
  }

  return skills;
}

function writeRepoContent(repo: RepoConfig, readme: string) {
  const frontmatter = compact({
    id: repo.id,
    name: repo.name,
    description: repo.description || '',
    tags: repo.tags || [],
    repoUrl: repo.repoUrl,
    defaultBranch: repo.defaultBranch
  });
  const markdown = matter.stringify(readme, frontmatter);
  const dest = path.join(CONTENT_REPOS, repo.id, 'index.md');
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

async function main() {
  ensureDir(CONTENT_SKILLS);
  ensureDir(CONTENT_REPOS);
  ensureDir(DATA_DIR);
  ensureDir(PUBLIC_DIR);

  if (!TOKEN) {
    console.warn('WARN: No se definió GITHUB_TOKEN/GITHUB_PAT; los repos privados no podrán descargarse.');
    throw new Error('Falta GITHUB_TOKEN o GITHUB_PAT para leer repos privados.');
  }

  const repos = readConfig();
  const allSkills: SkillDoc[] = [];
  const repoData: RepoJson[] = [];

  for (const repo of repos) {
    const readme = (await fetchReadmeApi(repo)) || (await fetchReadmeRaw(repo)) || '# README no encontrado\nActualiza readmePath en config/repos.yaml.';

    writeRepoContent(repo, readme);
    const skills = await collectSkillsFromRemote(repo);
    allSkills.push(...skills);
    repoData.push({
      id: repo.id,
      name: repo.name,
      description: repo.description || '',
      tags: repo.tags || [],
      url: `/repos/${repo.id}`
    });
  }

  fs.writeFileSync(path.join(DATA_DIR, 'skills.json'), JSON.stringify(allSkills, null, 2));
  fs.writeFileSync(path.join(DATA_DIR, 'repos.json'), JSON.stringify(repoData, null, 2));

  const searchIndex = buildSearchIndex(allSkills);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'search-index.json'), JSON.stringify(searchIndex, null, 2));

  console.log(`Repos procesados: ${repoData.length}`);
  console.log(`Skills procesadas: ${allSkills.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
