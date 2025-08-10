import { createClient } from '@supabase/supabase-js';

// Exact credentials and URLs as provided
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://brroucjplqmngljroknr.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTg4NDksImV4cCI6MjA3MDEzNDg0OX0.a9QHFs7JtfRM3y5pi82jqAFmrwDRuaPLwDUzeBlG7uE';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1ODg0OSwiZXhwIjoyMDcwMTM0ODQ5fQ.vMDzajYZQ8k-AqzTKdM0D5nCsj85XRI7YGObMzVQyOc';
const SUPABASE_FUNCTION_URL = process.env.SUPABASE_FUNCTION_URL || 'https://brroucjplqmngljroknr.supabase.co/functions/v1/hyper-handler';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function callEdge(action: string, table?: string, extra?: Record<string, any>) {
  const res = await fetch(SUPABASE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, table, ...extra }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Edge function error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

async function execSql(sql: string) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw error;
  return data;
}

async function createCoreTables() {
  // Execute all core DDL via exec_sql RPC for compatibility
  const ddls: string[] = [
    `CREATE EXTENSION IF NOT EXISTS pgcrypto;`,
    `CREATE TABLE IF NOT EXISTS webinars (
      id text PRIMARY KEY,
      title text NOT NULL,
      host text NOT NULL,
      date date,
      time text,
      category text,
      image text,
      meet_url text,
      subtitle text,
      trainer_name text,
      trainer_title text,
      trainer_bio text,
      trainer_image text,
      created_at timestamptz DEFAULT now()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_webinars_category ON webinars(category);`,
    `CREATE INDEX IF NOT EXISTS idx_webinars_date ON webinars(date);`,
    `CREATE INDEX IF NOT EXISTS idx_webinars_created_at ON webinars(created_at DESC);`,

    `CREATE TABLE IF NOT EXISTS scrape_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      run_time timestamptz DEFAULT now(),
      source text,
      trigger_type text,
      category_or_keyword text,
      records_fetched int,
      status text,
      message text
    );`,
    `CREATE INDEX IF NOT EXISTS idx_scrape_logs_run_time ON scrape_logs(run_time);`,
    `CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON scrape_logs(source);`,

    `CREATE TABLE IF NOT EXISTS blogs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text,
      slug text UNIQUE,
      content text,
      keywords text[],
      meta_description text,
      created_at timestamptz DEFAULT now()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);`,

    `CREATE TABLE IF NOT EXISTS guides (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      topic text,
      content text,
      seo_keywords text[],
      created_at timestamptz DEFAULT now()
    );`,

    `CREATE TABLE IF NOT EXISTS sales_funnel (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_name text,
      lead_email text,
      source text,
      funnel_stage text,
      created_at timestamptz DEFAULT now()
    );`
  ];

  for (const sql of ddls) {
    console.log('Executing core DDL via exec_sql...');
    await execSql(sql);
  }
}

async function createAdditionalTables() {
  // Use exec_sql RPC to create missing tables if the function exists in DB
  const ddls: string[] = [
    `DO $$
     BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_type') THEN
         CREATE TYPE registration_type AS ENUM ('reminder','live_join');
       END IF;
     END$$;` ,
    `CREATE TABLE IF NOT EXISTS webinar_registrations (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       webinar_id text NOT NULL,
       name text NOT NULL,
       email text NOT NULL,
       whatsapp_number text,
       registration_type registration_type NOT NULL,
       created_at timestamptz DEFAULT now()
     );`,
    `CREATE TABLE IF NOT EXISTS google_meet_sessions (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       webinar_id text NOT NULL,
       meet_url text NOT NULL,
       session_id text,
       created_at timestamptz DEFAULT now(),
       expires_at timestamptz
     );`,
    `CREATE TABLE IF NOT EXISTS scraper_analytics (
       id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       scraper_id text,
       scraper_name text,
       start_time timestamptz,
       end_time timestamptz,
       duration_ms int,
       webinars_found int,
       webinars_added int,
       webinars_updated int,
       errors text,
       success boolean,
       category text,
       keyword text,
       created_at timestamptz DEFAULT now()
     );`,
    `CREATE INDEX IF NOT EXISTS idx_registrations_webinar ON webinar_registrations(webinar_id);`,
    `CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON webinar_registrations(created_at DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_gmeet_webinar ON google_meet_sessions(webinar_id);`,
    `CREATE INDEX IF NOT EXISTS idx_scraper_analytics_time ON scraper_analytics(start_time);`
  ];

  for (const sql of ddls) {
    try {
      console.log('Executing SQL via RPC exec_sql...');
      await execSql(sql);
      console.log(' -> ok');
    } catch (e: any) {
      console.error('exec_sql failed:', e.message);
      console.error('Your Supabase project may not have the exec_sql function enabled.');
      console.error('DDL that failed was:\n', sql);
      throw e;
    }
  }
}

async function seedAndVerify() {
  const sampleId = `sample-${Date.now()}`;

  console.log('Inserting sample webinar...');
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = '12:00:00';

  const { data: wData, error: wErr } = await supabase
    .from('webinars')
    .insert({
      id: sampleId,
      title: 'Sample Webinar',
      host: 'WebinarPilot',
      date: dateStr,
      time: timeStr,
      category: 'Technology',
      image: null,
      meet_url: 'https://meet.google.com/pnz-piqy-vvx',
      subtitle: 'Getting started',
      trainer_name: 'Trainer X',
      trainer_title: 'Senior Instructor',
      trainer_bio: 'Expert in webinars',
      trainer_image: null,
    })
    .select()
    .single();
  if (wErr) throw wErr;
  console.log(' -> Webinar inserted:', wData.id);

  console.log('Inserting sample registration...');
  const { data: rData, error: rErr } = await supabase
    .from('webinar_registrations')
    .insert({
      webinar_id: sampleId,
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      whatsapp_number: null,
      registration_type: 'live_join'
    })
    .select()
    .single();
  if (rErr) throw rErr;
  console.log(' -> Registration inserted:', rData.id);

  console.log('Querying webinars and registrations...');
  const { data: qWebinars, error: qWebinarsErr } = await supabase
    .from('webinars')
    .select('*')
    .limit(5);
  if (qWebinarsErr) throw qWebinarsErr;

  const { data: qRegs, error: qRegsErr } = await supabase
    .from('webinar_registrations')
    .select('*')
    .eq('webinar_id', sampleId);
  if (qRegsErr) throw qRegsErr;

  console.log('Verification summary:', {
    webinarsCount: qWebinars?.length || 0,
    registrationsForSample: qRegs?.length || 0
  });
}

async function main() {
  try {
    console.log('--- Supabase Initialization Start ---');
    console.log('Project:', SUPABASE_URL);

    try {
      await createCoreTables();
    } catch (e: any) {
      console.warn('Skipping core DDL creation due to error:', e.message || e);
    }

    try {
      await createAdditionalTables();
    } catch (e: any) {
      console.warn('Skipping additional DDL creation due to error:', e.message || e);
    }

    await seedAndVerify();

    console.log('--- Supabase Initialization Complete ---');
  } catch (err: any) {
    console.error('Initialization failed:', err.message || err);
    process.exit(1);
  }
}

main();
