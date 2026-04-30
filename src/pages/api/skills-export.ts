import type { APIRoute } from 'astro';
import * as XLSX from 'xlsx';
import { readReposConfig } from '../../lib/config';
import { requireToken } from '../../lib/github.service';
import { collectAllSkills } from '../../lib/skill.service';
import { getRepoContext, parseRepoSlug, type RepoContext } from '../../lib/repo.service';

const EXCEL_BRAND = {
  headerBg: '1F4E78',
  headerText: 'FFFFFF',
  titleBg: '0F243E',
  titleText: 'FFFFFF',
  stripeBg: 'F2F7FC',
  border: 'D9E2EC'
};

function applyHeaderStyle(sheet: XLSX.WorkSheet, headerRow: number, totalColumns: number): void {
  for (let col = 0; col < totalColumns; col += 1) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: col });
    const cell = sheet[cellRef] as XLSX.CellObject | undefined;
    if (!cell) continue;
    (cell as XLSX.CellObject & { s?: unknown }).s = {
      font: { bold: true, color: { rgb: EXCEL_BRAND.headerText } },
      fill: { fgColor: { rgb: EXCEL_BRAND.headerBg } },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        top: { style: 'thin', color: { rgb: EXCEL_BRAND.border } },
        bottom: { style: 'thin', color: { rgb: EXCEL_BRAND.border } },
        left: { style: 'thin', color: { rgb: EXCEL_BRAND.border } },
        right: { style: 'thin', color: { rgb: EXCEL_BRAND.border } }
      }
    };
  }
}

function applyAlternatingRows(sheet: XLSX.WorkSheet, startRow: number, endRow: number, totalColumns: number): void {
  for (let row = startRow; row <= endRow; row += 1) {
    if ((row - startRow) % 2 !== 1) continue;
    for (let col = 0; col < totalColumns; col += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = sheet[cellRef] as XLSX.CellObject | undefined;
      if (!cell) continue;
      const currentStyle = ((cell as XLSX.CellObject & { s?: Record<string, unknown> }).s || {}) as Record<string, unknown>;
      (cell as XLSX.CellObject & { s?: unknown }).s = {
        ...currentStyle,
        fill: { fgColor: { rgb: EXCEL_BRAND.stripeBg } }
      };
    }
  }
}

function freezeTopRow(sheet: XLSX.WorkSheet, topLeftCell: string): void {
  (sheet as XLSX.WorkSheet & { '!freeze'?: unknown })['!freeze'] = {
    xSplit: 0,
    ySplit: 1,
    topLeftCell,
    activePane: 'bottomLeft',
    state: 'frozen'
  };
}

function applyTitleStyle(sheet: XLSX.WorkSheet, cellRef: string): void {
  const cell = sheet[cellRef] as XLSX.CellObject | undefined;
  if (!cell) return;
  (cell as XLSX.CellObject & { s?: unknown }).s = {
    font: { bold: true, sz: 13, color: { rgb: EXCEL_BRAND.titleText } },
    fill: { fgColor: { rgb: EXCEL_BRAND.titleBg } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
}

function toBrowserRepoUrl(repoUrl: string): string {
  const slug = parseRepoSlug(repoUrl);
  if (slug) return `https://github.com/${slug.owner}/${slug.name}`;
  return repoUrl;
}

function formatIsoDate(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().replace('T', ' ').slice(0, 19);
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

  const rows = skills.map((skill, index) => {
    const matchingRepo = repos.find((repo) => repo.id === skill.repoId);
    const repoBaseUrl = matchingRepo ? toBrowserRepoUrl(matchingRepo.repoUrl) : '';
    const context = repoContextById.get(skill.repoId);
    const branch = context?.defaultBranch || matchingRepo?.defaultBranch || 'main';
    const skillSourceUrl = repoBaseUrl && skill.sourcePath
      ? `${repoBaseUrl}/blob/${encodeURIComponent(branch)}/${skill.sourcePath}`
      : '';

    return {
      '#': index + 1,
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
      Score: Number(skill.score.toFixed(4)),
      'Stars Repositorio': skill.repoStars,
      'Ultima Actualizacion': formatIsoDate(skill.lastUpdated),
      'Ruta Fuente': skill.sourcePath
    };
  });

  const workbook = XLSX.utils.book_new();
  workbook.Props = {
    Title: 'Skills Consolidado Ejecutivo',
    Subject: 'Reporte de Skills y Repositorios',
    Author: 'Skills Portal',
    Company: 'AI Dev Innovators',
    CreatedDate: new Date()
  };
  const detailSheet = XLSX.utils.json_to_sheet(rows);

  rows.forEach((row, index) => {
    const excelRow = index + 2;
    const links = [
      { column: 'G', value: row['URL Repositorio'] },
      { column: 'H', value: row['URL Skill Portal'] },
      { column: 'I', value: row['URL Archivo SKILL.md'] }
    ];

    links.forEach((link) => {
      if (!link.value) return;
      const cellRef = `${link.column}${excelRow}`;
      const cell = detailSheet[cellRef];
      if (!cell) return;
      cell.l = { Target: link.value, Tooltip: 'Abrir enlace' };
    });
  });

  detailSheet['!autofilter'] = { ref: 'A1:Z1' };
  freezeTopRow(detailSheet, 'A2');
  applyHeaderStyle(detailSheet, 0, 26);
  applyAlternatingRows(detailSheet, 1, rows.length, 26);
  detailSheet['!rows'] = [{ hpx: 24 }];
  detailSheet['!cols'] = [
    { wch: 5 },
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

  XLSX.utils.book_append_sheet(workbook, detailSheet, 'Skills Detalle');

  const recommendedCount = skills.filter((skill) => skill.status === 'recommended').length;
  const examplesCount = skills.filter((skill) => skill.hasExamples).length;
  const estimatedTimeValues = skills.filter((skill) => typeof skill.estimatedTime === 'number').map((skill) => skill.estimatedTime as number);
  const avgScore = skills.length > 0 ? skills.reduce((acc, skill) => acc + skill.score, 0) / skills.length : 0;
  const avgEstimatedTime = estimatedTimeValues.length > 0
    ? estimatedTimeValues.reduce((acc, value) => acc + value, 0) / estimatedTimeValues.length
    : 0;
  const coverageRecommended = skills.length > 0 ? Math.round((recommendedCount / skills.length) * 100) : 0;
  const coverageExamples = skills.length > 0 ? Math.round((examplesCount / skills.length) * 100) : 0;

  const statusCounts = skills.reduce<Record<string, number>>((acc, skill) => {
    acc[skill.status] = (acc[skill.status] || 0) + 1;
    return acc;
  }, {});

  const frameworkCounts = skills
    .flatMap((skill) => skill.frameworks || [])
    .reduce<Record<string, number>>((acc, framework) => {
      const normalized = framework || 'sin-framework';
      acc[normalized] = (acc[normalized] || 0) + 1;
      return acc;
    }, {});

  const topFrameworkRows = Object.entries(frameworkCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([framework, count]) => [framework, count]);

  const summaryRows: Array<Array<string | number>> = [
    ['Reporte Ejecutivo', 'Consolidado de Skills'],
    ['Fecha de exportacion', formatIsoDate(new Date().toISOString())],
    ['Total de repos evaluados', repos.length],
    ['Repos con skills', new Set(skills.map((skill) => skill.repoId)).size],
    ['Total de skills', skills.length],
    ['Skills recommended', recommendedCount],
    ['Cobertura recommended (%)', coverageRecommended],
    ['Skills con ejemplos', examplesCount],
    ['Cobertura con ejemplos (%)', coverageExamples],
    ['Score promedio', Number(avgScore.toFixed(4))],
    ['Tiempo promedio estimado (min)', Math.round(avgEstimatedTime)]
  ];

  summaryRows.push([]);
  summaryRows.push(['Distribucion por estado', 'Cantidad']);
  Object.entries(statusCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([status, count]) => {
      summaryRows.push([status, count]);
    });

  summaryRows.push([]);
  summaryRows.push(['Top frameworks', 'Cantidad']);
  topFrameworkRows.forEach((row) => summaryRows.push(row));

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
  applyTitleStyle(summarySheet, 'A1');
  applyHeaderStyle(summarySheet, 12, 2);
  applyHeaderStyle(summarySheet, 19, 2);
  summarySheet['!rows'] = [{ hpx: 26 }];
  summarySheet['!cols'] = [{ wch: 38 }, { wch: 26 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen Ejecutivo');

  const repoRows = repos
    .map((repo) => {
      const repoSkills = skills.filter((skill) => skill.repoId === repo.id);
      const repoRecommended = repoSkills.filter((skill) => skill.status === 'recommended').length;
      const repoExamples = repoSkills.filter((skill) => skill.hasExamples).length;
      const repoAvgScore = repoSkills.length > 0
        ? repoSkills.reduce((acc, skill) => acc + skill.score, 0) / repoSkills.length
        : 0;

      return {
        'Repositorio ID': repo.id,
        Repositorio: repo.name,
        'URL Repositorio': toBrowserRepoUrl(repo.repoUrl),
        'Total Skills': repoSkills.length,
        Recommended: repoRecommended,
        'Con Ejemplos': repoExamples,
        'Score Promedio': Number(repoAvgScore.toFixed(4)),
        Tags: (repo.tags || []).join(', ')
      };
    })
    .sort((a, b) => b['Total Skills'] - a['Total Skills']);

  const repoSheet = XLSX.utils.json_to_sheet(repoRows);
  repoRows.forEach((row, index) => {
    const cellRef = `C${index + 2}`;
    const cell = repoSheet[cellRef];
    if (!cell || !row['URL Repositorio']) return;
    cell.l = { Target: row['URL Repositorio'], Tooltip: 'Abrir repositorio' };
  });
  repoSheet['!autofilter'] = { ref: 'A1:H1' };
  freezeTopRow(repoSheet, 'A2');
  applyHeaderStyle(repoSheet, 0, 8);
  applyAlternatingRows(repoSheet, 1, repoRows.length, 8);
  repoSheet['!rows'] = [{ hpx: 24 }];
  repoSheet['!cols'] = [
    { wch: 28 },
    { wch: 26 },
    { wch: 46 },
    { wch: 13 },
    { wch: 14 },
    { wch: 14 },
    { wch: 13 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(workbook, repoSheet, 'Repositorios');

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
