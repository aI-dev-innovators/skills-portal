import type { APIRoute } from 'astro';
import * as XLSX from 'xlsx';
import { readReposConfig } from '../../lib/config';
import { requireToken } from '../../lib/github.service';
import { collectAllSkills } from '../../lib/skill.service';
import { getRepoContext, parseRepoSlug, type RepoContext } from '../../lib/repo.service';

function toBrowserRepoUrl(repoUrl: string): string {
  const slug = parseRepoSlug(repoUrl);
  if (slug) return `https://github.com/${slug.owner}/${slug.name}`;
  return repoUrl;
}

export const GET: APIRoute = async () => {
  requireToken();
  const repos = await readReposConfig();
  const skills = (await collectAllSkills(repos)).sort((a, b) => a.title.localeCompare(b.title));

  const contextEntries = await Promise.all(
    repos.map(async (repo): Promise<[string, RepoContext | null]> => {
      const context = await getRepoContext(repo);
      return [repo.id, context];
    })
  );
  const repoContextById = new Map<string, RepoContext | null>(contextEntries);

  const rows = skills.map((skill) => {
    const matchingRepo = repos.find((repo) => repo.id === skill.repoId);
    const repoBaseUrl = matchingRepo ? toBrowserRepoUrl(matchingRepo.repoUrl) : '';
    const context = repoContextById.get(skill.repoId);
    const branch = context?.defaultBranch || matchingRepo?.defaultBranch || 'main';
    const skillSourceUrl = repoBaseUrl && skill.sourcePath
      ? `${repoBaseUrl}/blob/${encodeURIComponent(branch)}/${skill.sourcePath}`
      : '';

    return {
      'ID Skill': skill.id,
      'Nombre Skill': skill.title,
      'Descripcion': skill.description,
      'Repositorio ID': skill.repoId,
      Repositorio: skill.repoName,
      'URL Repositorio': repoBaseUrl,
      'URL Skill Portal': skill.url,
      'URL Archivo SKILL.md': skillSourceUrl,
      Nivel: skill.level,
      Estado: skill.status,
      Version: skill.version,
      'Tiempo Estimado (min)': skill.estimatedTime ?? '',
      Frameworks: (skill.frameworks || []).join(', '),
      'Tipos de Prueba': (skill.testTypes || []).join(', '),
      Tags: (skill.tags || []).join(', '),
      'Incluye Ejemplos': skill.hasExamples ? 'Si' : 'No',
      'Incluye Templates': skill.hasTemplates ? 'Si' : 'No',
      'Incluye Evals': skill.hasEvals ? 'Si' : 'No',
      'Incluye Scripts': skill.hasScripts ? 'Si' : 'No',
      Badges: (skill.badges || []).join(', '),
      'Comandos Recomendados': (skill.recommendedCommands || []).join(' | '),
      Score: skill.score,
      'Stars Repositorio': skill.repoStars,
      'Ultima Actualizacion': skill.lastUpdated || '',
      'Ruta Fuente': skill.sourcePath
    };
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    const links = [
      { column: 'F', value: row['URL Repositorio'] },
      { column: 'G', value: row['URL Skill Portal'] },
      { column: 'H', value: row['URL Archivo SKILL.md'] }
    ];

    links.forEach((link) => {
      if (!link.value) return;
      const cellRef = `${link.column}${excelRow}`;
      const cell = worksheet[cellRef];
      if (!cell) return;
      cell.l = { Target: link.value, Tooltip: 'Abrir enlace' };
    });
  });

  worksheet['!autofilter'] = { ref: 'A1:Y1' };
  worksheet['!cols'] = [
    { wch: 28 },
    { wch: 34 },
    { wch: 52 },
    { wch: 24 },
    { wch: 24 },
    { wch: 45 },
    { wch: 36 },
    { wch: 52 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
    { wch: 26 },
    { wch: 20 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 38 },
    { wch: 10 },
    { wch: 16 },
    { wch: 20 },
    { wch: 42 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Skills');

  const recommendedCount = skills.filter((skill) => skill.status === 'recommended').length;
  const examplesCount = skills.filter((skill) => skill.hasExamples).length;
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Reporte', 'Consolidado de Skills'],
    ['Fecha de exportacion', new Date().toISOString()],
    ['Total de skills', skills.length],
    ['Skills recommended', recommendedCount],
    ['Skills con ejemplos', examplesCount]
  ]);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `skills-consolidado-${stamp}.xlsx`;

  return new Response(new Uint8Array(bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache'
    }
  });
};
