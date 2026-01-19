import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardContent } from '../ui';
import { MapPin, Plane, BookOpen, Sparkles, ArrowRight, Check } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Wanderlust',
    description: 'Your cozy companion for planning adventures and capturing travel memories.',
    illustration: 'welcome',
  },
  {
    id: 'places',
    title: 'Build Your Bucket List',
    description: 'Add places you dream of visiting. Mark them as visited and rate your experiences.',
    icon: MapPin,
    color: 'primary',
  },
  {
    id: 'trips',
    title: 'Plan Your Adventures',
    description: 'Create detailed trip itineraries with day-by-day activities and interactive maps.',
    icon: Plane,
    color: 'secondary',
  },
  {
    id: 'journal',
    title: 'Capture Memories',
    description: 'Write about your experiences with photos, mood tracking, and weather snapshots.',
    icon: BookOpen,
    color: 'accent',
  },
  {
    id: 'ready',
    title: "You're All Set!",
    description: 'Start by adding your first dream destination to your bucket list.',
    illustration: 'ready',
  },
];

export const OnboardingModal = ({ isOpen, onComplete }: OnboardingModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative overflow-hidden">
              <div className="absolute top-4 right-4 z-10">
                {!isLastStep && (
                  <button
                    onClick={handleSkip}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    Skip
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 pt-12"
                >
                  <div className="flex flex-col items-center text-center">
                    {step.illustration === 'welcome' && <WelcomeIllustration />}
                    {step.illustration === 'ready' && <ReadyIllustration />}
                    {step.icon && (
                      <motion.div
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 ${
                          step.color === 'primary'
                            ? 'bg-primary-light/30'
                            : step.color === 'secondary'
                              ? 'bg-secondary/20'
                              : 'bg-accent/30'
                        }`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring' }}
                      >
                        <step.icon
                          size={36}
                          className={
                            step.color === 'primary'
                              ? 'text-primary'
                              : step.color === 'secondary'
                                ? 'text-secondary'
                                : 'text-accent'
                          }
                        />
                      </motion.div>
                    )}

                    <motion.h2
                      className="text-2xl font-bold text-foreground mb-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      {step.title}
                    </motion.h2>

                    <motion.p
                      className="text-muted max-w-xs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {step.description}
                    </motion.p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="px-8 pb-8">
                <div className="flex items-center justify-center gap-2 mb-6">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? 'w-6 bg-primary'
                          : index < currentStep
                            ? 'w-2 bg-primary/50'
                            : 'w-2 bg-border-light'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={handleNext}
                  className="w-full"
                  size="lg"
                  rightIcon={isLastStep ? <Check size={18} /> : <ArrowRight size={18} />}
                >
                  {isLastStep ? "Let's Go!" : 'Continue'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const WelcomeIllustration = () => (
  <motion.div
    className="mb-6"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 0.1, duration: 0.4 }}
  >
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.circle
        cx="60" cy="45" r="35"
        className="fill-primary-light/30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
      />
      <motion.g
        initial={{ y: 10 }}
        animate={{ y: -5 }}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2, ease: 'easeInOut' }}
      >
        <path
          d="M60 25C50 25 42 33 42 43C42 58 60 73 60 73C60 73 78 58 78 43C78 33 70 25 60 25Z"
          className="fill-primary"
        />
        <circle cx="60" cy="42" r="8" className="fill-surface" />
      </motion.g>
      <motion.path
        d="M25 70C30 65 40 68 50 65"
        className="stroke-secondary"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      />
      <motion.path
        d="M70 65C80 68 90 65 95 70"
        className="stroke-accent"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      />
      <motion.g
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        <Sparkles className="text-warning absolute" style={{ left: 75, top: 20 }} size={16} />
      </motion.g>
    </svg>
  </motion.div>
);

const ReadyIllustration = () => (
  <motion.div
    className="mb-6"
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ delay: 0.1, duration: 0.4 }}
  >
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <motion.circle
        cx="60" cy="50" r="40"
        className="fill-secondary/20"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
      />
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      >
        <circle cx="60" cy="50" r="25" className="fill-secondary" />
        <motion.path
          d="M48 50L55 57L72 40"
          className="stroke-white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        />
      </motion.g>
      <motion.circle
        cx="25" cy="30" r="6"
        className="fill-primary"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
      />
      <motion.circle
        cx="95" cy="35" r="4"
        className="fill-accent"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7, type: 'spring' }}
      />
      <motion.circle
        cx="90" cy="75" r="5"
        className="fill-warning"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.8, type: 'spring' }}
      />
      <motion.circle
        cx="30" cy="70" r="4"
        className="fill-primary-light"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.9, type: 'spring' }}
      />
    </svg>
  </motion.div>
);

export default OnboardingModal;
