
import React from 'react';
import { useSignInForm } from '@/hooks/auth/useSignInForm';
import { useAuthFlow } from '@/hooks/auth/useAuthFlow';

export const useSignIn = () => {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    setIsLoading
  } = useSignInForm();

  const { executeSignIn } = useAuthFlow();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSignIn(email, password, setIsLoading);
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    isLoading,
    handleSignIn
  };
};
