import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Fallback for Node.js runtime without dotenv
  if (key === 'VITE_SUPABASE_URL') {
    return 'https://egoubzbjkfpsathwgxjm.supabase.co';
  }
  if (key === 'VITE_SUPABASE_ANON_KEY') {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnb3ViemJqa2Zwc2F0aHdneGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3OTM3MTQsImV4cCI6MjEwNjM2OTcxNH0.Fu9GIsV3cSobb-Zd34luAzHrTgg5UMyFKA57fAinmdA';
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isLiveSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('mock-prod') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project-id')
  );
};

export const supabase = createClient(
  supabaseUrl || 'https://egoubzbjkfpsathwgxjm.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnb3ViemJqa2Zwc2F0aHdneGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3OTM3MTQsImV4cCI6MjEwNjM2OTcxNH0.Fu9GIsV3cSobb-Zd34luAzHrTgg5UMyFKA57fAinmdA'
);
