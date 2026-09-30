import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';
import { Mail, ArrowLeft, CheckCircle2, Layers } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.requestPasswordReset(email);
      setIsSuccess(true);
      toast.success('Password reset email simulated successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto font-sans">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#252522] text-[#C6A15B] border border-[#4A4A43] shadow-md mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#252522] tracking-tight">EntityMatch AI</h1>
      </div>

      <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 sm:p-8 shadow-xs">
        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#DCE5D7] text-[#58704F] border border-[#A4B89D] mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-[#252522]">Reset instructions sent</h2>
            <p className="text-xs text-[#5E5A51] mt-2 mb-6 leading-relaxed">
              We have simulated sending password recovery instructions to{' '}
              <strong className="text-[#252522]">{email}</strong>.
            </p>
            <Link to="/login">
              <Button variant="secondary" className="w-full" icon={ArrowLeft}>
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-[#252522] mb-1">Reset your password</h2>
            <p className="text-xs text-[#5E5A51] mb-6">
              Enter your registered email address and we will send you password reset instructions.
            </p>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-lg border border-[#CFA8A0] bg-[#F0DCD7] text-[#A34B40] text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#252522] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7E796E] absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@entitymatch.ai"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[#E9E2D5] border border-[#B8B2A5] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C6A15B]/40 focus:border-[#C6A15B] text-[#252522] placeholder-[#7E796E]"
                  />
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
                Send Reset Link
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5E5A51] hover:text-[#252522] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#C6A15B]" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

