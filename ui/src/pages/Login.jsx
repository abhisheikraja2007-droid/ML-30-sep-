import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';

export function Login() {
  return (
    <div className="min-h-screen bg-[#D9D3C7] flex flex-col items-center justify-center p-4">
      <LoginForm />
    </div>
  );
}

