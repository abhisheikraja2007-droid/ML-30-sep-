import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { DEMO_CREDENTIALS_HINT } from '../../data/mockAuth';
import { Button } from '../common/Button';
import { Eye, EyeOff, Lock, Mail, Layers, ShieldCheck } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email address and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password, remember);
      toast.success('Successfully authenticated. Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify your credentials.');
      toast.error('Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const autofillDemo = () => {
    setEmail(DEMO_CREDENTIALS_HINT.email);
    setPassword(DEMO_CREDENTIALS_HINT.password);
    setErrorMsg('');
  };

  return (
    <div className="w-full max-w-lg mx-auto font-sans">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#252522] text-[#C6A15B] border border-[#4A4A43] shadow-md mb-4">
          <Layers className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#252522] tracking-tight">EntityMatch AI</h1>
        <p className="text-xs font-bold text-[#C6A15B] mt-1 uppercase tracking-wider">
          Enterprise Business Entity Resolution Platform
        </p>
      </div>

      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-2xl p-8 sm:p-10 shadow-xs">
        <h2 className="text-2xl font-bold text-[#252522] mb-1">Sign in to workspace</h2>
        <p className="text-sm text-[#5E5A51] mb-8">
          Access record matching workspace & evaluation pipeline
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl border border-[#CFA8A0] bg-[#F0DCD7] text-[#A34B40] text-sm font-semibold flex items-start gap-3">
            <span className="shrink-0 mt-0.5">•</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[#252522] mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-[#7E796E] absolute left-4 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-12 pr-4 py-3 text-base bg-[#E9E2D5] border border-[#B8B2A5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] text-[#252522] placeholder-[#7E796E] min-h-[48px]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-[#252522]">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-[#C6A15B] hover:text-[#9E7B3F] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-[#7E796E] absolute left-4 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-12 pr-12 py-3 text-base bg-[#E9E2D5] border border-[#B8B2A5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] text-[#252522] placeholder-[#7E796E] min-h-[48px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-[#7E796E] hover:text-[#252522] p-0.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-[#AAA194] text-[#252522] focus:ring-[#C6A15B]/40"
              />
              <span className="text-sm font-medium text-[#5E5A51]">Remember session</span>
            </label>
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full min-h-[48px]" isLoading={isSubmitting}>
            Sign In to Workspace
          </Button>
        </form>

        {/* Demo Credentials Hint Box */}
        <div className="mt-8 pt-6 border-t border-[#C7C0B4] bg-[#E9E2D5] -mx-8 sm:-mx-10 -mb-8 sm:-mb-10 p-5 rounded-b-2xl border-x-0 border-b-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-[#252522]">
                <ShieldCheck className="w-4 h-4 text-[#C6A15B] shrink-0" />
                <span>Demo Access Credentials</span>
              </div>
              <p className="text-xs text-[#5E5A51] mt-1 leading-relaxed">
                Email: <code className="text-[#252522] font-mono font-bold">{DEMO_CREDENTIALS_HINT.email}</code>
                <br />
                Password: <code className="text-[#252522] font-mono font-bold">{DEMO_CREDENTIALS_HINT.password}</code>
              </p>
            </div>
            <button
              type="button"
              onClick={autofillDemo}
              className="text-xs font-bold text-[#C6A15B] hover:text-[#9E7B3F] hover:underline shrink-0 pt-0.5 cursor-pointer"
            >
              Auto-fill Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

