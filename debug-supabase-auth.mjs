import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://evbvyfwffeodgotemlty.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YnZ5ZndmZmVvZGdvdGVtbHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NzgwNzUsImV4cCI6MjEwMTI1NDA3NX0.Om0eJ2JsigLEPrU8BbSbRR58NvliPbkcQJWLqW-A7LM';

const supabase = createClient(url, key);
console.log('Supabase client initialized:', !!supabase);

const main = async () => {
  const email = `debug-${Date.now()}@gmail.com`;
  const password = 'password123';
  console.log('email', email);

  console.log('--- signUp ---');
  const signUp = await supabase.auth.signUp({
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
  console.log(JSON.stringify(signUp, null, 2));

  console.log('--- signIn ---');
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  console.log(JSON.stringify(signIn, null, 2));

  console.log('--- getSession ---');
  const session = await supabase.auth.getSession();
  console.log(JSON.stringify(session, null, 2));
};

main().catch((error) => {
  console.error('ERROR', error);
  process.exit(1);
});
