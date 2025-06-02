
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export class AuthService {
  static async signInWithPassword(email: string, password: string) {
    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase().slice(0, 255);
    const sanitizedPassword = password.slice(0, 72); // Max password length
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return { data: null, error: { message: 'Invalid email format' } };
    }
    
    console.log('Authentication attempt'); // No sensitive data logged
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: sanitizedPassword,
    });

    return { data: signInData, error: signInError };
  }

  static async signUpWithPassword(email: string, password: string) {
    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase().slice(0, 255);
    const sanitizedPassword = password.slice(0, 72);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return { data: null, error: { message: 'Invalid email format' } };
    }
    
    console.log('Creating new auth user'); // No sensitive data logged
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password: sanitizedPassword,
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
