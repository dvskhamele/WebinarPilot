import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import postgres from 'https://deno.land/x/postgresjs@v3.4.3/mod.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DatabaseAction {
  action: 'create_table' | 'insert' | 'update' | 'query' | 'trigger_scrape';
  table?: string;
  schema?: any;
  data?: any;
  where?: any;
  limit?: number;
  source?: string;
  keyword?: string;
  category?: string;
  trigger_type?: string;
  force?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? 'https://brroucjplqmngljroknr.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycm91Y2pwbHFtbmdsanJva25yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1ODg0OSwiZXhwIjoyMDcwMTM0ODQ5fQ.vMDzajYZQ8k-AqzTKdM0D5nCsj85XRI7YGObMzVQyOc'
    )

    const execSql = async (sql: string) => {
      try {
        const { data, error } = await supabaseClient.rpc('exec_sql', { sql })
        if (error) throw error
        return { data, error: null }
      } catch (e: any) {
        const dbUrl = Deno.env.get('SUPABASE_DB_URL')
        if (!dbUrl) {
          return { data: null, error: new Error(`exec_sql RPC failed and SUPABASE_DB_URL not set: ${e?.message || e}`) }
        }
        try {
          const sqlClient = postgres(dbUrl, { prepare: false })
          await sqlClient.unsafe(sql)
          await sqlClient.end()
          return { data: 'ok', error: null }
        } catch (pgErr) {
          return { data: null, error: pgErr }
        }
      }
    }

    const body: DatabaseAction = await req.json()
    let result: any = null

    switch (body.action) {
      case 'create_table':
        // For table creation, we'll use RPC to execute raw SQL
        if (body.table === 'webinars') {
          const { data, error } = await execSql(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto;
            CREATE TABLE IF NOT EXISTS webinars (
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
            );
            CREATE INDEX IF NOT EXISTS idx_webinars_category ON webinars(category);
            CREATE INDEX IF NOT EXISTS idx_webinars_date ON webinars(date);
            CREATE INDEX IF NOT EXISTS idx_webinars_created_at ON webinars(created_at DESC);
          `)
          result = { success: true, data, error }
        } else if (body.table === 'scrape_logs') {
          const { data, error } = await execSql(`
            CREATE TABLE IF NOT EXISTS scrape_logs (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              run_time timestamptz DEFAULT now(),
              source text,
              trigger_type text,
              category_or_keyword text,
              records_fetched int,
              status text,
              message text
            );
            CREATE INDEX IF NOT EXISTS idx_scrape_logs_run_time ON scrape_logs(run_time);
            CREATE INDEX IF NOT EXISTS idx_scrape_logs_source ON scrape_logs(source);
          `)
          result = { success: true, data, error }
        } else if (body.table === 'blogs') {
          const { data, error } = await execSql(`
            CREATE TABLE IF NOT EXISTS blogs (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              title text,
              slug text UNIQUE,
              content text,
              keywords text[],
              meta_description text,
              created_at timestamptz DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
          `)
          result = { success: true, data, error }
        } else if (body.table === 'guides') {
          const { data, error } = await execSql(`
            CREATE TABLE IF NOT EXISTS guides (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              topic text,
              content text,
              seo_keywords text[],
              created_at timestamptz DEFAULT now()
            );
          `)
          result = { success: true, data, error }
        } else if (body.table === 'sales_funnel') {
          const { data, error } = await execSql(`
            CREATE TABLE IF NOT EXISTS sales_funnel (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              lead_name text,
              lead_email text,
              source text,
              funnel_stage text,
              created_at timestamptz DEFAULT now()
            );
          `)
          result = { success: true, data, error }
        } else if (body.table === 'webinar_registrations') {
          const { data, error } = await execSql(`
            DO $
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'registration_type') THEN
                CREATE TYPE registration_type AS ENUM ('reminder','live_join');
              END IF;
            END$;
            CREATE TABLE IF NOT EXISTS webinar_registrations (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              webinar_id text NOT NULL,
              name text NOT NULL,
              email text NOT NULL,
              whatsapp_number text,
              registration_type registration_type NOT NULL,
              created_at timestamptz DEFAULT now()
            );
            CREATE INDEX IF NOT EXISTS idx_registrations_webinar ON webinar_registrations(webinar_id);
            CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON webinar_registrations(created_at DESC);
          `)
          result = { success: true, data, error }
        } else if (body.table === 'google_meet_sessions') {
          const { data, error } = await execSql(`
            CREATE TABLE IF NOT EXISTS google_meet_sessions (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              webinar_id text NOT NULL,
              meet_url text NOT NULL,
              session_id text,
              created_at timestamptz DEFAULT now(),
              expires_at timestamptz
            );
            CREATE INDEX IF NOT EXISTS idx_gmeet_webinar ON google_meet_sessions(webinar_id);
          `)
          result = { success: true, data, error }
        } else if (body.table === 'scraper_analytics') {
          const { data, error } = await execSql(`
            CREATE TABLE IF NOT EXISTS scraper_analytics (
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
            );
            CREATE INDEX IF NOT EXISTS idx_scraper_analytics_time ON scraper_analytics(start_time);
          `)
          result = { success: true, data, error }
        }
        break

      case 'insert':
        if (!body.table || !body.data) {
          throw new Error('Table and data are required for insert')
        }
        const { data: insertData, error: insertError } = await supabaseClient
          .from(body.table)
          .insert(body.data)
          .select()
        result = { data: insertData, error: insertError }
        break

      case 'update':
        if (!body.table || !body.where || !body.data) {
          throw new Error('Table, where clause, and data are required for update')
        }
        const { data: updateData, error: updateError } = await supabaseClient
          .from(body.table)
          .update(body.data)
          .match(body.where)
          .select()
        result = { data: updateData, error: updateError }
        break

      case 'query':
        if (!body.table) {
          throw new Error('Table is required for query')
        }
        let query = supabaseClient.from(body.table).select('*')
        
        if (body.where) {
          Object.entries(body.where).forEach(([key, value]) => {
            if (typeof value === 'string' && value.startsWith('>')) {
              query = query.gt(key, value.substring(1))
            } else {
              query = query.eq(key, value)
            }
          })
        }
        
        if (body.limit) {
          query = query.limit(body.limit)
        }
        
        const { data: queryData, error: queryError } = await query
        result = { data: queryData, error: queryError }
        break

      case 'trigger_scrape':
        // This would trigger the scraper orchestrator
        // For now, we'll just log the request and return a success response
        const scrapeLog = {
          id: crypto.randomUUID(),
          run_time: new Date().toISOString(),
          source: body.source || 'all',
          trigger_type: body.trigger_type || 'manual',
          category_or_keyword: body.category || body.keyword || 'general',
          records_fetched: 0,
          status: 'triggered',
          message: 'Scrape job triggered successfully'
        }
        
        const { data: logData, error: logError } = await supabaseClient
          .from('scrape_logs')
          .insert(scrapeLog)
          .select()
          
        result = { 
          success: true, 
          message: 'Scrape triggered successfully',
          data: logData,
          error: logError 
        }
        break

      default:
        throw new Error(`Unknown action: ${body.action}`)
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})