/**
 * LandingPage — full landing page with:
 *   - Hero (Playfair heading, animated words, CTAs)
 *   - Feature grid (6 cards)
 *   - How it works (3 steps)
 *   - Product preview (real UI screenshot placeholder built from real components)
 *   - Footer
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MessageSquare, BookOpen, CalendarDays, HelpCircle,
  FileText, BarChart2, ArrowRight, CheckCircle2,
  GraduationCap, Sparkles, Upload, Brain,
} from 'lucide-react'
import AuroraBackground from '@/components/reactbits/AuroraBackground'
import AnimatedHeading from '@/components/reactbits/AnimatedHeading'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

/* ── animation helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

/* ── Feature data ── */
const FEATURES = [
  {
    icon: MessageSquare,
    title: 'AI Academic Advisor',
    desc: 'Get personalised study advice, explanations, and guidance from an LLM that knows your profile and subjects.',
  },
  {
    icon: CalendarDays,
    title: 'Smart Study Planner',
    desc: 'Auto-generate a study schedule tailored to your exam dates, available hours, and weak areas.',
  },
  {
    icon: HelpCircle,
    title: 'Quiz Generator',
    desc: 'Practice MCQ, true/false and short-answer quizzes. Answers are scored on the server — no cheating.',
  },
  {
    icon: FileText,
    title: 'PDF Assistant (RAG)',
    desc: 'Upload your lecture notes or textbook PDFs. Ask questions and get grounded, cited answers.',
  },
  {
    icon: BarChart2,
    title: 'Strength & Weakness Analytics',
    desc: 'Transparent, code-computed per-topic scores. The AI only phrases advice from the real numbers.',
  },
  {
    icon: BookOpen,
    title: 'Career Guidance',
    desc: 'Based on your interests and academic goals, get a curated career roadmap with skills and project ideas.',
  },
]

/* ── How it works steps ── */
const STEPS = [
  {
    num: '01',
    icon: GraduationCap,
    title: 'Create your profile',
    desc: 'Tell us your course, semester, subjects, and how many hours a week you can study.',
  },
  {
    num: '02',
    icon: Upload,
    title: 'Add your materials',
    desc: 'Enter your marks and topics, or upload PDFs. Your adviser uses real data — nothing is made up.',
  },
  {
    num: '03',
    icon: Brain,
    title: 'Get AI-powered guidance',
    desc: 'Chat with your advisor, generate a study plan, take quizzes, and track your progress over time.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text-main">
      {/* ── Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-30 backdrop-blur-md transition-all"
        style={{
          background: 'rgba(254, 250, 243, 0.88)',
          borderBottom: '1px solid rgba(132, 162, 130, 0.22)',
          boxShadow: '0 2px 14px rgba(132, 162, 130, 0.08)',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #84A282, #5E7A5C)',
                border: '1px solid rgba(184, 207, 179, 0.50)',
                boxShadow: '0 0 14px rgba(132, 162, 130, 0.30)',
                color: '#FEFAF3',
              }}
            >
              <GraduationCap size={19} />
            </span>
            <span className="font-display text-base font-bold tracking-tight" style={{ color: '#2D3A2C' }}>
              Scholar Sense
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <AuroraBackground className="pt-32 pb-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{
              background: 'rgba(246, 226, 233, 0.65)',
              border: '1px solid rgba(132, 162, 130, 0.35)',
              color: '#5E7A5C',
              boxShadow: '0 0 16px rgba(246, 226, 233, 0.50)',
            }}
          >
            <Sparkles size={14} style={{ color: '#84A282' }} />
            AI-powered academic advisor — tailored for your curriculum
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-tight text-text-main"
          >
            <AnimatedHeading
              staticText="Study smarter,"
              words={['not harder.', 'with AI.', 'every day.']}
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-text-secondary leading-relaxed"
          >
            Your Personal Academic Adviser — powered by Gemini AI — knows your
            subjects, tracks your marks, builds study plans, generates quizzes, answers questions
            from your PDFs, and helps you chart a career path. All in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start for free <ArrowRight size={17} />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Sign in to your account
              </Button>
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-text-muted"
          >
            {['No credit card needed', 'Free Gemini API key', 'Your data stays yours'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-success" /> {t}
              </span>
            ))}
          </motion.div>
        </div>
      </AuroraBackground>

      {/* ── Product preview ── */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="relative rounded-2xl border border-border bg-surface p-2 shadow-2xl">
            {/* Mock browser chrome */}
            <div className="mb-2 flex items-center gap-1.5 px-2 py-1">
              <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="mx-auto rounded-md border border-border bg-raised px-12 py-1 text-xs text-text-muted">
                app.scholarsense.ai/dashboard
              </span>
            </div>
            {/* Fake app preview built from real styles */}
            <div className="flex rounded-xl border border-border overflow-hidden h-72">
              {/* Mini sidebar */}
              <div className="w-14 bg-surface border-r border-border flex flex-col items-center py-4 gap-4">
                <div className="h-7 w-7 rounded-lg bg-elevated border border-border-strong flex items-center justify-center">
                  <GraduationCap size={14} className="text-accent" />
                </div>
                {[MessageSquare, CalendarDays, HelpCircle, FileText].map((Icon, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-elevated text-accent' : 'hover:bg-raised text-text-muted'}`}
                  >
                    <Icon size={15} />
                  </div>
                ))}
              </div>
              {/* Content */}
              <div className="flex-1 bg-bg p-4 overflow-hidden">
                <p className="font-display text-sm font-semibold text-text-main mb-3">Dashboard</p>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Subjects', val: '6' },
                    { label: 'Avg Score', val: '74%' },
                    { label: 'Study hrs', val: '18' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-border bg-surface p-2">
                      <p className="text-base font-bold text-text-main">{s.val}</p>
                      <p className="text-[10px] text-text-muted">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <p className="text-xs font-medium text-text-secondary mb-2">Recent AI Chat</p>
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <div className="h-5 w-5 rounded-full bg-raised shrink-0" />
                      <div className="h-3 flex-1 rounded-full bg-raised" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <div className="h-3 w-32 rounded-full bg-primary/20" />
                      <div className="h-5 w-5 rounded-full bg-primary/20 shrink-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className="mb-12 text-center"
          >
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-text-main mb-4">
              Everything a student needs
            </motion.h2>
            <motion.p variants={fadeUp} className="text-text-secondary max-w-xl mx-auto">
              Six powerful tools, one unified platform. Built on real data — no lorem ipsum, no fake numbers.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} variants={fadeUp}>
                <Card hover className="h-full flex flex-col gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon size={20} className="text-primary-soft" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-main mb-1">{title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 py-20 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
          >
            <motion.h2 variants={fadeUp} className="font-display text-4xl font-bold text-text-main text-center mb-14">
              How it works
            </motion.h2>
            <div className="grid gap-8 md:grid-cols-3">
              {STEPS.map(({ num, icon: Icon, title, desc }) => (
                <motion.div key={num} variants={fadeUp} className="relative flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 shrink-0">
                      <Icon size={22} className="text-primary-soft" />
                    </div>
                    <span className="font-display text-3xl font-bold text-border">{num}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-text-main mb-2">{title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 py-20">
        <div
          className="mx-auto max-w-3xl rounded-2xl p-10 md:p-14 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(132, 162, 130, 0.15) 0%, rgba(246, 226, 233, 0.40) 50%, rgba(184, 207, 179, 0.20) 100%)',
            border: '1px solid rgba(132, 162, 130, 0.35)',
            boxShadow: '0 0 32px rgba(132, 162, 130, 0.18), 0 4px 16px rgba(132, 162, 130, 0.10)',
          }}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full blur-2xl opacity-40" style={{ background: '#F6E2E9' }} />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-40 w-40 rounded-full blur-2xl opacity-30" style={{ background: '#B8CFB3' }} />

          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: '#2D3A2C' }}>
            Ready to ace your semester?
          </h2>
          <p className="mb-8 max-w-md mx-auto text-sm" style={{ color: '#4A5E49' }}>
            Create your free account in 60 seconds. Powered by Gemini AI with full curriculum grounding.
          </p>
          <Link to="/register">
            <Button size="lg" className="shadow-glow-accent">
              Get started free <ArrowRight size={17} />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-primary-soft" />
            <span className="font-display text-sm font-semibold text-text-main">Personal Academic Adviser</span>
          </div>
          <p className="text-xs text-text-muted">
            AI suggestions are generated, not guaranteed. Always verify important information.
          </p>
        </div>
      </footer>
    </div>
  )
}
