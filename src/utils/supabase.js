import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 리모컨 생성 후 다른 파일에서 쓸 수 있게 수출(export)합니다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
