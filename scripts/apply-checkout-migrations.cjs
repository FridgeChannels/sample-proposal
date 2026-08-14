#!/usr/bin/env node
/** Apply checkout migrations when SUPABASE_DB_URL or DATABASE_URL is set. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const SQL_PATH = path.join(ROOT, 'supabase/migrations/20260814154500_customer_billing_and_terms_acceptance.sql');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(ENV_PATH);

async function main() {
  const connectionString =
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    '';

  if (!connectionString) {
    console.error('Set SUPABASE_DB_URL or DATABASE_URL to apply migrations automatically.');
    console.error(`Or run SQL manually: ${SQL_PATH}`);
    process.exit(1);
  }

  const { Client } = require('pg');
  const sql = fs.readFileSync(SQL_PATH, 'utf8');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log('Applied checkout migrations successfully.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});
