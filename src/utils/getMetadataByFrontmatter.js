import { getFileName } from './helpers/pathUtils.js';

export async function getMetadataByFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  
  if (!match) {
    return {};
  }
  
  const metadata = {};
  const lines = match[1].split('\n');
  
  for (const line of lines) {
    if (!line.includes(':')) continue;
    const [key, ...valueParts] = line.split(':');
    const cleanKey = key.trim();
    const cleanValue = valueParts.join(':').trim();
    metadata[cleanKey] = cleanValue || null;
  }
  
  return metadata;
}
