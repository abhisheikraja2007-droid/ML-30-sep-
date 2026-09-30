/**
 * Helper utility to generate TSV strings conforming to Problem Statement rules:
 * - Tab-separated columns (\t)
 * - Comma-separated list for matched/candidate entity IDs
 * - Empty string for singletons (NEVER "None", "NULL", "No Match")
 * - 1 row per Source 1 entity
 */

export function generateMatchingResultsTSV(resultsList) {
  const header = 'source1_entity_id\tmatched_entity_ids';
  const rows = resultsList.map(item => {
    const matchedStr = (item.matched_entity_ids && item.matched_entity_ids.length > 0)
      ? item.matched_entity_ids.join(',')
      : '';
    return `${item.source1_entity_id}\t${matchedStr}`;
  });
  return [header, ...rows].join('\n');
}

export function generateCandidatePairsTSV(resultsList) {
  const header = 'source1_entity_id\tcandidate_entity_ids';
  const rows = resultsList.map(item => {
    const candidateStr = (item.candidate_ids && item.candidate_ids.length > 0)
      ? item.candidate_ids.join(',')
      : '';
    return `${item.source1_entity_id}\t${candidateStr}`;
  });
  return [header, ...rows].join('\n');
}

export function triggerFileDownload(content, filename, mimeType = 'text/tab-separated-values') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
