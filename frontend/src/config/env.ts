export function requiredEnv(
  name: string,
  options: { allowEmpty?: boolean } = {},
): string {
  const value = import.meta.env[name];

  if (typeof value !== "string") {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  if (!options.allowEmpty && value.trim() === "") {
    throw new Error(`Environment variable cannot be empty: ${name}`);
  }

  return value;
}

export function optionalEnv(name: string): string | undefined {
  const value = import.meta.env[name];
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}
