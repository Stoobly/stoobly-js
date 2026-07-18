import { REQUEST_SEQUENCE_ID } from "@constants/custom_headers";

/**
 * Tracks per-scope request sequence ids for `X-Stoobly-Request-Sequence-Id`.
 *
 * Scope: uppercase method + scheme + hostname + port + pathname.
 * Counters start at 0 and are reset when a new interceptor session is created.
 */
export class RequestSequenceId {
  private counters: Map<string, number> = new Map();

  /**
   * Sets `X-Stoobly-Request-Sequence-Id` on the given headers object.
   */
  apply(headers: Record<string, string>, method: string, url: string) {
    headers[REQUEST_SEQUENCE_ID] = String(this.next(method, url));
  }

  /**
   * Returns the next sequence id for the request's scope and increments the counter.
   */
  next(method: string, url: string): number {
    const scope = RequestSequenceId.buildScope(method, url);
    const current = this.counters.get(scope) ?? 0;
    this.counters.set(scope, current + 1);
    return current;
  }

  /**
   * Clears all per-scope counters.
   */
  reset() {
    this.counters.clear();
  }

  /**
   * Builds a stable scope key from method + URL.
   * Prefers an absolute URL as-is; resolves relative URLs against `window.location` when available.
   */
  static buildScope(method: string, url: string): string {
    const normalizedMethod = (method || 'GET').toUpperCase();
    let parsed: URL;

    try {
      try {
        parsed = new URL(url);
      } catch {
        if (typeof window === 'undefined' || !window.location?.href) {
          throw new Error('relative url without base');
        }
        parsed = new URL(url, window.location.href);
      }
    } catch {
      // Fall back to the raw URL so relative/invalid inputs still get a stable scope.
      return `${normalizedMethod}|${url}`;
    }

    const scheme = parsed.protocol.replace(/:$/, '');
    const port =
      parsed.port ||
      (scheme === 'https' ? '443' : scheme === 'http' ? '80' : '');

    return `${normalizedMethod}|${scheme}|${parsed.hostname}|${port}|${parsed.pathname}`;
  }
}
