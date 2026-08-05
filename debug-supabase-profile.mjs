import { createClient } from '@supabase/supabase-js';

const url = 'https://evbvyfwffeodgotemlty.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YnZ5ZndmZmVvZGdvdGVtbHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzgwNzUsImV4cCI6MjEwMTI1NDA3NX0.Om0eJ2JsigLEPrU8BbSbRR58NvliPbkcQJWLqW-A7LM';
const supabase = createClient(url, key);

const main = async () => {
  const email = `debug-${Date.now()}@gmail.com`;
  const password = 'password123';
  console.log('=== SIGNUP ===');
  const signup = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'student',
        full_name: 'Debug User',
        room_number: 'D1',
      },
    },
  });
  console.log('signUp', JSON.stringify(signup, null, 2));

  const userId = signup.data.user?.id;
  if (userId) {
    const profile = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    console.log('profileQuery', JSON.stringify(profile, null, 2));
  }

  console.log('=== SIGNIN ===');
  const signin = await supabase.auth.signInWithPassword({ email, password });
  console.log('signIn', JSON.stringify(signin, null, 2));

  const session = await supabase.auth.getSession();
  console.log('getSession', JSON.stringify(session, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});