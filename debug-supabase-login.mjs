import { createClient } from '@supabase/supabase-js';

const url = 'https://evbvyfwffeodgotemlty.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YnZ5ZndmZmVvZGdvdGVtbHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzgwNzUsImV4cCI6MjEwMTI1NDA3NX0.Om0eJ2JsigLEPrU8BbSbRR58NvliPbkcQJWLqW-A7LM';
const supabase = createClient(url, key);

const main = async () => {
  const email = 'warden@example.com';
  const password = 'password123';

  console.log('--- signIn ---');
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  console.log(JSON.stringify(signIn, null, 2));

  console.log('--- getSession ---');
  const session = await supabase.auth.getSession();
  console.log(JSON.stringify(session, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});