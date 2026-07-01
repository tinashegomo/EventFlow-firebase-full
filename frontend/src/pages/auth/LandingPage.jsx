import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { firebaseUser, isEmailVerified } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (firebaseUser && isEmailVerified) navigate('/dashboard', { replace: true });
  }, [firebaseUser, isEmailVerified, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-app-bg-primary">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, var(--color-accent-light) 0%, transparent 50%), radial-gradient(circle at 80% 80%, var(--color-accent-light) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-6 min-h-screen flex flex-col">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-app-accent text-white flex items-center justify-center font-display font-semibold">
              EF
            </div>
            <span className="font-display text-lg font-semibold">EventFlow</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-app-border bg-app-bg-secondary hover:bg-app-bg-tertiary"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-app-accent-light text-app-accent-dark text-xs font-medium mb-6"
          >
            <Sparkles size={12} /> For event companies of every scale
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-app-text-primary leading-tight max-w-3xl"
          >
            Your Events,{' '}
            <span className="text-app-accent">Perfectly</span>{' '}
            Orchestrated.
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 text-base md:text-lg text-app-text-secondary max-w-2xl"
          >
            Plan, schedule, and invoice weddings, graduations, and corporate
            functions — all from one beautiful workspace built for event teams.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-10 flex flex-col sm:flex-row items-center gap-3"
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-app-accent text-white font-medium hover:bg-app-accent-dark transition shadow-sm"
            >
              Get Started <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-app-border bg-app-bg-secondary text-app-text-primary font-medium hover:bg-app-bg-tertiary transition"
            >
              Sign In
            </Link>
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl"
          >
            {[
              { label: 'Multi-Org', desc: 'Isolated data per company' },
              { label: 'Role-Based', desc: 'Admins & staff permissions' },
              { label: 'Audit Trail', desc: 'Every change is logged' },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-2xl border border-app-border bg-app-bg-secondary p-5 text-left"
              >
                <p className="text-sm font-semibold text-app-text-primary">
                  {f.label}
                </p>
                <p className="mt-1 text-xs text-app-text-secondary">
                  {f.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </main>

        <footer className="text-center text-xs text-app-text-muted py-6">
          &copy; {new Date().getFullYear()} EventFlow
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
