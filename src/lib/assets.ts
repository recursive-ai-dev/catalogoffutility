/** Keep public assets beside the packaged entry point when Electron uses file URLs. */
export function resolvePublicAssetUrl(source: string, baseUrl = document.baseURI): string {
  if (!source.startsWith("/") || source.startsWith("//")) return source;
  try {
    const base = new URL(baseUrl);
    return base.protocol === "file:" ? new URL(source.slice(1), base).href : source;
  } catch {
    return source;
  }
}
