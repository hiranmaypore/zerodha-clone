import { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';

const TOUR_STEPS = [
  {
    target: 'body',
    content: '👋 Welcome to Zerodha Clone! Let me show you around the key features of your trading platform.',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="sidebar-dashboard"]',
    content: '📊 This is your Dashboard — the command center for trading. View live charts, place orders, and monitor your portfolio in real-time.',
  },
  {
    target: '[data-tour="sidebar-market"]',
    content: '🏛️ Market Overview — Browse all available stocks, view sector heatmaps, and discover trading opportunities.',
  },
  {
    target: '[data-tour="sidebar-orders"]',
    content: '📋 Orders — Track all your active, pending, and completed orders in one place.',
  },
  {
    target: '[data-tour="sidebar-holdings"]',
    content: '💼 Portfolio — View your holdings, positions, and portfolio analytics with sector allocation and risk metrics.',
  },
  {
    target: '[data-tour="sidebar-journal"]',
    content: '📔 Trade Journal — Analyze your trading performance with real P&L analytics, win rates, and trade history.',
  },
  {
    target: '[data-tour="sidebar-pulse"]',
    content: '⚡ Pulse — Your market intelligence hub with volume shockers, RSI screeners, and live news feed.',
  },
  {
    target: '[data-tour="sidebar-algolab"]',
    content: '🤖 AlgoLab — AI-powered trading signals with one-click copy trading and strategy customization.',
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: '🎨 Toggle between dark and light themes for your preferred trading environment.',
  },
  {
    target: 'body',
    content: '🚀 You\'re all set! Start by exploring the Dashboard or browse the Market. Happy trading!',
    placement: 'center',
  },
];

const tourStyles = {
  options: {
    arrowColor: 'var(--color-card, #161b22)',
    backgroundColor: 'var(--color-card, #161b22)',
    overlayColor: 'rgba(0, 0, 0, 0.7)',
    primaryColor: '#3B82F6',
    textColor: 'var(--color-primary, #e6edf3)',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid var(--color-edge, #30363d)',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
  },
  tooltipContent: {
    fontSize: '14px',
    lineHeight: '1.6',
  },
  buttonNext: {
    backgroundColor: '#3B82F6',
    borderRadius: '12px',
    padding: '8px 20px',
    fontSize: '13px',
    fontWeight: '700',
  },
  buttonBack: {
    color: 'var(--color-muted, #7d8590)',
    fontSize: '13px',
    fontWeight: '600',
  },
  buttonSkip: {
    color: 'var(--color-muted, #7d8590)',
    fontSize: '12px',
  },
  buttonClose: {
    color: 'var(--color-muted, #7d8590)',
  },
};

export default function OnboardingTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('onboarding_complete');
    if (!hasSeenTour) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      localStorage.setItem('onboarding_complete', 'true');
    }
  };

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClicking
      styles={tourStyles}
      callback={handleCallback}
      locale={{
        back: '← Back',
        close: 'Close',
        last: 'Finish 🎉',
        next: 'Next →',
        skip: 'Skip Tour',
      }}
    />
  );
}

// Export a manual trigger for settings/profile
export function useTourReset() {
  return () => {
    localStorage.removeItem('onboarding_complete');
    window.location.reload();
  };
}
