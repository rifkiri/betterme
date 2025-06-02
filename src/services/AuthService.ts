
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class AuthService {
  static async signInWithPassword(email: string, password: string) {
    console.log('Attempting to sign in with email:', email);
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data: signInData, error: signInError };
  }

  static async signUpWithPassword(email: string, password: string) {
    console.log('Creating new auth user...');
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    return { data: signUpData, error: signUpError };
  }

  static async updateLastLogin(userId: string) {
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
  }
}
