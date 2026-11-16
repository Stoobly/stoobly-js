const SCENARIO_NAME_DELIMITER = ' > ';

export function pathBasename(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}

/**
 * Builds a UI-friendly scenario name from a spec file and test title.
 * Example: "interceptor.spec.js > should send request with scenario name header"
 */
export function scenarioNameFromFileAndTitle(
  filePath?: string | null,
  title?: string | null
): string | undefined {
  const file =
    typeof filePath === 'string' && filePath.length
      ? pathBasename(filePath)
      : undefined;
  const testTitle =
    typeof title === 'string' && title.length ? title : undefined;

  if (file && testTitle) {
    return `${file}${SCENARIO_NAME_DELIMITER}${testTitle}`;
  }

  return file || testTitle;
}
