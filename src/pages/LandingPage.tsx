import { Link } from 'react-router-dom';
import {
  ArrowRight, Cpu, Code2, Zap, Users, Clock, CheckCircle2,
  ChevronDown, BookOpen, Laptop, MessageSquare
} from 'lucide-react';
import { getUrlParams } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { ref } = getUrlParams();
  const { user, isAdmin, logout } = useAuth();

  const registerUrl = ref
    ? `/register?ref=${ref}&utm_source=referral&utm_campaign=ai_workshop`
    : '/register';

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-navy-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-navy-900">AI Workshop</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-navy-600">
            <a href="#learn" className="hover:text-navy-900 transition-colors">What You'll Learn</a>
            <a href="#who" className="hover:text-navy-900 transition-colors">Who Should Attend</a>
            <a href="#faq" className="hover:text-navy-900 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  to={isAdmin ? '/dashboard' : '/student/dashboard'}
                  className="px-3.5 py-1.5 text-xs font-semibold text-navy-700 hover:text-navy-900 border border-navy-200 rounded-lg hover:bg-navy-50 transition-colors"
                >
                  {isAdmin ? 'Admin Dashboard' : 'Student Dashboard'}
                </Link>
                <button
                  onClick={() => logout()}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-navy-700 hover:text-navy-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to={registerUrl}
                  className="px-4 py-2 bg-accent-600 text-white text-sm font-semibold rounded-lg hover:bg-accent-700 transition-colors shadow-sm"
                >
                  Register Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 sm:py-28 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-50 text-accent-700 text-sm font-medium rounded-full mb-6 border border-accent-100">
            <Zap className="h-3.5 w-3.5" />
            Free Online Workshop
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 leading-tight tracking-tight mb-6">
            Build Your First AI Project{' '}
            <span className="text-accent-600">in 60 Minutes</span>
          </h1>
          <p className="text-lg sm:text-xl text-navy-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Learn how to turn an idea into a small, working AI-powered project. 
            No prior AI experience needed — just bring your curiosity and a laptop.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={registerUrl}
              id="hero-register-cta"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent-600 text-white font-semibold rounded-xl hover:bg-accent-700 transition-all shadow-lg shadow-accent-600/20 text-lg"
            >
              Register for Free
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#learn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-navy-700 font-medium rounded-xl hover:bg-navy-50 transition-colors border border-navy-200 text-lg"
            >
              What You'll Build
              <ChevronDown className="h-5 w-5" />
            </a>
          </div>
          <p className="mt-6 text-sm text-navy-400">
            Designed for final-year engineering students
          </p>
        </div>
      </section>

      {/* What You'll Learn */}
      <section id="learn" className="py-20 px-4 sm:px-6 bg-white border-y border-navy-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
              What You'll Learn
            </h2>
            <p className="text-navy-600 text-lg max-w-2xl mx-auto">
              In 60 minutes, you'll go from zero to a working AI project you can show to anyone.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <BookOpen className="h-6 w-6" />,
                title: 'Understand the AI Workflow',
                desc: 'Learn the practical steps to define a problem, choose an approach, and build a solution using AI APIs and tools.',
              },
              {
                icon: <Code2 className="h-6 w-6" />,
                title: 'Write Real Code',
                desc: 'Build a functional mini-project with actual code — not just theory slides. You\'ll have working code by the end.',
              },
              {
                icon: <Cpu className="h-6 w-6" />,
                title: 'Use AI APIs & Models',
                desc: 'Get hands-on experience calling AI APIs, processing inputs, and generating useful outputs programmatically.',
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: 'Ship Something Small',
                desc: 'The goal isn\'t perfection — it\'s building something that works, end to end, in a single session.',
              },
              {
                icon: <MessageSquare className="h-6 w-6" />,
                title: 'Ask & Discuss',
                desc: 'Get your questions answered live. The workshop is interactive — not a lecture.',
              },
              {
                icon: <Laptop className="h-6 w-6" />,
                title: 'Take It Further',
                desc: 'Walk away with ideas and resources to keep building on your own after the session.',
              },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-navy-100 bg-warm-50 hover:border-accent-200 transition-colors">
                <div className="w-11 h-11 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-navy-900 mb-2">{item.title}</h3>
                <p className="text-navy-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Project */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
              What You'll Build
            </h2>
            <p className="text-navy-600 text-lg">
              A realistic example of the kind of project you'll create during the workshop.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-navy-100 p-8 sm:p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-navy-900 text-white flex items-center justify-center shrink-0">
                <Code2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy-900 mb-1">
                  AI-Powered Text Summarizer
                </h3>
                <p className="text-navy-500 text-sm">
                  Example project · Built in ~45 minutes
                </p>
              </div>
            </div>
            <p className="text-navy-700 mb-6 leading-relaxed">
              Paste any article or long text, and your app summarizes it into key points using an 
              AI API. You'll build the input form, connect to the AI model, process the response, 
              and display a clean summary — all from scratch.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Set up a simple web interface',
                'Connect to an AI text API',
                'Send user input and parse the response',
                'Display formatted results',
                'Handle errors gracefully',
                'Deploy locally for testing',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-navy-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who Should Attend */}
      <section id="who" className="py-20 px-4 sm:px-6 bg-white border-y border-navy-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4">
              Who Should Attend
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-100">
              <h3 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                This workshop is for you if…
              </h3>
              <ul className="space-y-3 text-sm text-emerald-700">
                <li>You're a final-year engineering student</li>
                <li>You want to build an AI project but haven't started</li>
                <li>You want something practical to discuss in interviews</li>
                <li>You're comfortable writing basic code in any language</li>
                <li>You have 60 minutes and an internet connection</li>
              </ul>
            </div>
            <div className="p-6 rounded-xl bg-warm-50 border border-navy-100">
              <h3 className="font-semibold text-navy-700 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                What you need
              </h3>
              <ul className="space-y-3 text-sm text-navy-600">
                <li className="flex items-start gap-2">
                  <Laptop className="h-4 w-4 shrink-0 mt-0.5" />
                  A laptop with a code editor installed
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 shrink-0 mt-0.5" />
                  Stable internet connection
                </li>
                <li className="flex items-start gap-2">
                  <Code2 className="h-4 w-4 shrink-0 mt-0.5" />
                  Basic familiarity with any programming language
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5" />
                  60 minutes of uninterrupted time
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is this really free?',
                a: 'Yes, the workshop is completely free. No hidden charges, no upsells during the session.',
              },
              {
                q: 'Do I need AI or machine learning experience?',
                a: 'No. This workshop is designed for beginners to AI. You should be comfortable writing basic code (in any language), but prior AI experience is not required.',
              },
              {
                q: 'What language or tools will we use?',
                a: 'We\'ll use Python and publicly available AI APIs. Specific setup instructions will be shared before the workshop.',
              },
              {
                q: 'Will I have a finished project at the end?',
                a: 'You\'ll have a working prototype — a small but functional AI-powered application. It won\'t be production-ready, but it will work and you can continue building on it.',
              },
              {
                q: 'Is this workshop only for CSE students?',
                a: 'It\'s designed for final-year engineering students of any branch. As long as you can write basic code, you\'re welcome.',
              },
              {
                q: 'How will the workshop be conducted?',
                a: 'The workshop is online and live. You\'ll follow along, write code, and can ask questions in real time.',
              },
            ].map((item, i) => (
              <details key={i} className="group bg-white rounded-xl border border-navy-100 overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-warm-50 transition-colors text-navy-900 font-medium">
                  {item.q}
                  <ChevronDown className="h-5 w-5 text-navy-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-navy-600 text-sm leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 bg-navy-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Build Your First AI Project?
          </h2>
          <p className="text-navy-300 text-lg mb-8 max-w-xl mx-auto">
            60 minutes. One project. Zero cost. Register now and take the first step.
          </p>
          <Link
            to={registerUrl}
            id="footer-register-cta"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-navy-900 font-semibold rounded-xl hover:bg-navy-50 transition-colors text-lg"
          >
            Register for Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 text-navy-400 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-navy-800 flex items-center justify-center">
              <Cpu className="h-3 w-3 text-navy-400" />
            </div>
            <span>AI Workshop Prototype</span>
          </div>
          <p className="text-center sm:text-right text-navy-500">
            This is a prototype demo. Not an official product. No real workshops are scheduled through this page.
          </p>
        </div>
      </footer>
    </div>
  );
}
