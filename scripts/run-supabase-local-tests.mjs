import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function parseSupabaseEnv(raw) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((envMap, line) => {
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) return envMap;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');

      envMap[key] = value;
      return envMap;
    }, {});
}

function getSupabaseLocalEnv() {
  try {
    const output = execSync('npx supabase status -o env', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    return parseSupabaseEnv(output);
  } catch (error) {
    const stderr = error.stderr?.toString?.() ?? '';
    const stdout = error.stdout?.toString?.() ?? '';
    const details = [stderr, stdout].filter(Boolean).join('\n').trim();

    console.error('No se pudo leer el entorno local de Supabase.');
    console.error('Asegurate de tener Supabase CLI instalado y el stack local corriendo con `npx supabase start`.');
    if (details) {
      console.error(details);
    }
    process.exit(1);
  }
}

const supabaseEnv = getSupabaseLocalEnv();

if (!supabaseEnv.API_URL || !supabaseEnv.ANON_KEY || !supabaseEnv.SERVICE_ROLE_KEY) {
  console.error('Faltan variables del entorno local de Supabase para correr la suite de integración.');
  console.error('Se esperaban al menos: API_URL, ANON_KEY y SERVICE_ROLE_KEY.');
  process.exit(1);
}

console.log('Running Supabase local integration tests...');
const vitestCommand = process.platform === 'win32'
  ? 'npx vitest run --config vitest.supabase.config.js'
  : 'npx vitest run --config vitest.supabase.config.js';

try {
  execSync(vitestCommand, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      SUPABASE_TEST_URL: supabaseEnv.API_URL,
      SUPABASE_TEST_ANON_KEY: supabaseEnv.ANON_KEY,
      SUPABASE_TEST_SERVICE_ROLE_KEY: supabaseEnv.SERVICE_ROLE_KEY,
    },
  });

  console.log('Supabase local integration tests passed.');
} catch (error) {
  if (typeof error.status === 'number') {
    process.exit(error.status);
  }

  console.error('No se pudo ejecutar Vitest para la suite local de Supabase.');
  console.error(error.message);
  process.exit(1);
}
