import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import {
  Layers,
  ArrowRight,
  Database,
  SearchCode,
  ShieldCheck,
  Cpu,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  Globe2
} from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen bg-[#D9D3C7] text-[#252522] flex flex-col font-sans">
      {/* Header Bar */}
      <header className="h-20 border-b border-[#343430] bg-[#252522] text-[#F1EBDD] sticky top-0 z-30 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#343430] border border-[#4A4A43] text-[#C6A15B] flex items-center justify-center font-bold shadow-xs">
            <Layers className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#F1EBDD]">
            EntityMatch AI
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="md" className="text-[#F1EBDD] hover:bg-[#343430]">
              Sign In
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="accent" size="md" icon={ArrowRight}>
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 sm:py-28 px-6 max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E6D9B9] border border-[#D8C18A] text-[#252522] text-sm font-bold">
            <Cpu className="w-4 h-4 text-[#C6A15B]" />
            <span>Enterprise Business Entity Resolution Platform</span>
          </div>

          <h1 className="type-hero-title text-[#252522] max-w-4xl mx-auto">
            AI-Powered Business Entity Resolution Across Noisy Data Sources
          </h1>

          <p className="type-body-lg text-[#5E5A51] max-w-3xl mx-auto leading-relaxed">
            Identify and link records that refer to the same real-world business entity across independent, un-keyed, and inconsistent commercial data sources.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Link to="/login">
              <Button variant="primary" size="lg" icon={ArrowRight}>
                Get Started with Platform Workspace
              </Button>
            </Link>
            <a href="#workflow">
              <Button variant="secondary" size="lg">
                View Resolution Workflow
              </Button>
            </a>
          </div>
        </section>

        {/* Workflow Diagram Section */}
        <section id="workflow" className="py-16 bg-[#E6E0D4] border-y border-[#C7C0B4] px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-[#252522] tracking-tight">
                End-to-End Entity Resolution Workflow
              </h2>
              <p className="text-base text-[#5E5A51] mt-2">
                Visualizing how reference records flow from candidate blocking through ML similarity matching to validated TSV export
              </p>
            </div>

            {/* Workflow Pipeline Stepper */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
              <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-5 flex flex-col items-center shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-[#E6E0D4] border border-[#C7C0B4] text-[#8B877C] flex items-center justify-center mb-3.5">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#252522]">1. SOURCE 1</h3>
                <p className="text-xs text-[#5E5A51] mt-1">Deduplicated Reference Entities</p>
              </div>

              <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-5 flex flex-col items-center shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-[#F1E4C9] border border-[#D8C18A] text-[#C6A15B] flex items-center justify-center mb-3.5">
                  <SearchCode className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#252522]">2. CANDIDATE BLOCKING</h3>
                <p className="text-xs text-[#5E5A51] mt-1">Source 2 & Source 3 Candidate Pairs</p>
              </div>

              <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-5 flex flex-col items-center shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-[#E6D9B9] border border-[#D8C18A] text-[#8A6545] flex items-center justify-center mb-3.5">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#252522]">3. SIMILARITY ANALYSIS</h3>
                <p className="text-xs text-[#5E5A51] mt-1">Name, Address & Country Signals</p>
              </div>

              <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-5 flex flex-col items-center shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-[#DCE5D7] border border-[#A4B89D] text-[#58704F] flex items-center justify-center mb-3.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#252522]">4. ML MATCH DECISION</h3>
                <p className="text-xs text-[#5E5A51] mt-1">Match, Singleton, or Review</p>
              </div>

              <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-5 flex flex-col items-center shadow-xs">
                <div className="w-11 h-11 rounded-xl bg-[#E9E2D5] border border-[#C7C0B4] text-[#252522] flex items-center justify-center mb-3.5">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-[#252522]">5. TSV EXPORT</h3>
                <p className="text-xs text-[#5E5A51] mt-1">Validated TSV Output Submission</p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Challenges Section */}
        <section className="py-20 px-6 max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-[#252522] tracking-tight">
              Core Technical Challenges Addressed
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#E6D9B9] text-[#C6A15B] flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#252522]">No Common Identifiers</h3>
              <p className="text-sm text-[#5E5A51] leading-relaxed">
                Independent sources lack universal tax IDs or shared registration keys. Matches must be inferred from noisy textual attributes.
              </p>
            </div>

            <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#DCE5D7] text-[#58704F] flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#252522]">Open-Ended Countries</h3>
              <p className="text-sm text-[#5E5A51] leading-relaxed">
                Architecture treats country as open-ended string data (US, India, France, UK, etc.) without rigid hardcoded geographic constraints.
              </p>
            </div>

            <div className="bg-[#F1EBDD] border border-[#C7C0B4] rounded-xl p-6 space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#F1E4C9] text-[#A8782E] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#252522]">Precision-Heavy Evaluation</h3>
              <p className="text-sm text-[#5E5A51] leading-relaxed">
                Evaluated on F0.5 score which penalizes false positives heavily to protect corporate master data integrity.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-[#343430] bg-[#252522] text-center text-sm text-[#B8B2A5]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 EntityMatch AI — Enterprise Business Entity Resolution Platform</p>
          <div className="flex items-center gap-4 font-semibold text-xs">
            <Link to="/login" className="hover:text-[#F1EBDD] hover:underline">Platform Sign In</Link>
            <span className="text-[#4A4A43]">|</span>
            <span>Problem Statement Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

