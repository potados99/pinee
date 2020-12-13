export default function getEnv(key: string, fallback: string | null = null): string | null {
  const allEnvArgs = process.env;

  return allEnvArgs[key] || fallback;
}

