// utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mduwlsmgrqqmuxnzijqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kdXdsc21ncnFxbXV4bnppanFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NDczNTUsImV4cCI6MjA0NjMyMzM1NX0.j3w76EdfZLLnTjthERhhvRSXt6xjRX_olJ58NxhEOps';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
