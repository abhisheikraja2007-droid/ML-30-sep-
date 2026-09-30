import { Link } from 'react-router-dom';

const steps = [
  {
    step: '01',
    icon: '🔍',
    title: 'Enter a Company Name',
    description:
      'Type in the name of any UK-registered business. You can optionally add an address to narrow down results.',
    color: 'bg-blue-50 border-blue-100'
  },
  {
    step: '02',
    icon: '⚡',
    title: 'Instant Verification',
    description:
      'EntityCheck searches the official UK Companies House registry in real time to find an exact match.',
    color: 'bg-emerald-50 border-emerald-100'
  },
  {
    step: '03',
    icon: '✅',
    title: 'Get a Verified Result',
    description:
      'See the official registered company name, company number, and a verification confidence score — instantly.',
    color: 'bg-violet-50 border-violet-100'
  }
];

const faqs = [
  {
    q: 'What data source does EntityCheck use?',
    a: 'EntityCheck uses the UK Companies House official registry, which contains over 5 million registered UK entities.'
  },
  {
    q: 'How accurate is the verification?',
    a: 'EntityCheck achieves a 97%+ verification accuracy on the Companies House dataset, with results typically available in under one second.'
  },
  {
    q: 'Do I need to type the full company name?',
    a: 'No — EntityCheck is designed to handle partial names, spelling variations, and names with or without legal suffixes like "Ltd" or "PLC".'
  },
  {
    q: 'Is my search data stored?',
    a: 'Search history is stored only in your browser (localStorage) and never sent to any external server. It can be cleared at any time.'
  }
];

export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <div className="bg-slate-900 py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
          About Entity<span className="text-emerald-400">Check</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          A fast, accurate, and privacy-respecting tool for verifying UK registered companies
          against the official Companies House registry.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-20">

        {/* How it works */}
        <section>
          <div className="text-center mb-10">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              How it works
            </span>
            <h2 className="text-3xl font-black text-slate-900">Simple. Fast. Accurate.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ step, icon, title, description, color }) => (
              <div key={step} className={`${color} border rounded-2xl p-6 relative`}>
                <span className="absolute top-5 right-5 text-xs font-black text-slate-300">{step}</span>
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Data source */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-8 py-6 flex items-center gap-4">
            <span className="text-3xl">🏛️</span>
            <div>
              <h2 className="text-xl font-black text-white">Powered by UK Companies House</h2>
              <p className="text-slate-400 text-sm mt-0.5">Official UK government business registry</p>
            </div>
          </div>
          <div className="px-8 py-6 space-y-4 text-slate-600 text-sm leading-relaxed">
            <p>
              Companies House is the UK's registrar of companies, maintained by His Majesty's Government.
              It holds the official register of over <strong className="text-slate-800">5 million</strong> UK
              registered companies, including their registered names, company numbers, and status.
            </p>
            <p>
              EntityCheck uses this dataset to provide authoritative verification of any UK business entity,
              helping users confirm that a company is legitimately registered.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {['5M+ Companies', 'Official UK Data', 'Real-time Search', 'Free to Use'].map(tag => (
                <span key={tag} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
                  ✓ {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-slate-100 shadow-sm px-6 py-5">
                <p className="font-bold text-slate-900 mb-2">{q}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-10">
          <h2 className="text-3xl font-black text-white mb-3">Ready to verify a company?</h2>
          <p className="text-slate-400 mb-6">Takes less than a second.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
          >
            Start Verifying →
          </Link>
        </section>
      </div>
    </div>
  );
}
