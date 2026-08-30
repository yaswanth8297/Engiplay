import * as React from 'react';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './utils/AuthContext';
import { Login } from './dashboard/Login';
import { LandingPage } from './dashboard/LandingPage';
import { Dashboard } from './dashboard/Dashboard';
import { GamePortal } from './games/shared/GamePortal';
import { SkillDashboard } from './dashboard/SkillDashboard';

const parseHashRoute = (): { view: 'landing' | 'dashboard' | 'game' | 'teacher'; gameId: string } => {
  const hash = window.location.hash || '';
  if (hash.startsWith('#/game/')) {
    const gameId = hash.replace('#/game/', '');
    return { view: 'game', gameId };
  }
  if (hash === '#/teacher') return { view: 'teacher', gameId: 'circuit-builder' };
  if (hash === '#/dashboard') return { view: 'dashboard', gameId: 'circuit-builder' };
  if (hash === '#/landing' || hash === '#/' || !hash) return { view: 'landing', gameId: 'circuit-builder' };
  return { view: 'dashboard', gameId: 'circuit-builder' };
};

const AppContent: React.FC = () => {
  const { user, loading, loginAsGuest } = useAuth();
  const [route, setRoute] = useState(parseHashRoute());

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHashRoute());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (view: string, gameId?: string) => {
    if (view === 'game' && gameId) {
      window.location.hash = `#/game/${gameId}`;
    } else if (view === 'teacher') {
      window.location.hash = '#/teacher';
    } else if (view === 'dashboard') {
      window.location.hash = '#/dashboard';
    } else {
      window.location.hash = '#/landing';
    }
  };

  const handleGuestPlay = async () => {
    await loginAsGuest();
    navigateTo('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F9F7] flex flex-col justify-center items-center gap-3 p-6 text-center">
        <div className="border-4 border-[#111111] p-4 bg-[#F9F9F7] max-w-sm w-full hard-shadow">
          <h1 className="font-serif text-2xl font-black uppercase text-[#111111] tracking-tight">THE ENGIPLAY GAZETTE</h1>
          <div className="border-t border-b border-[#111111] py-1 my-2 text-[10px] font-sans font-bold uppercase tracking-widest text-[#737373]">
            EDITION NO. 1 • INITIALIZING PRESSES
          </div>
          <div className="w-8 h-8 mx-auto my-3 border-2 border-[#111111] border-t-[#CC0000] animate-spin" />
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-[#111111]">PRINTING LAB MODULES...</p>
        </div>
      </div>
    );
  }

  // If user accesses landing page
  if (route.view === 'landing' && !user) {
    return (
      <LandingPage
        onEnterApp={() => {
          window.location.hash = '#/login';
        }}
        onGuestPlay={handleGuestPlay}
        onSelectGame={(gameId) => {
          navigateTo('game', gameId);
        }}
      />
    );
  }

  if (!user) {
    return <Login />;
  }

  // When logged in, landing route redirects or displays LandingPage
  if (route.view === 'landing') {
    return (
      <LandingPage
        onEnterApp={() => {
          navigateTo('dashboard');
        }}
        onGuestPlay={handleGuestPlay}
        onSelectGame={(gameId) => {
          navigateTo('game', gameId);
        }}
      />
    );
  }

  if (route.view === 'game') {
    return (
      <GamePortal 
        gameId={route.gameId} 
        onBack={() => navigateTo('dashboard')} 
      />
    );
  }

  if (route.view === 'teacher') {
    return (
      <SkillDashboard 
        inlineMode={false} 
        onBack={() => navigateTo('dashboard')} 
      />
    );
  }

  return (
    <Dashboard
      onSelectGame={(gameId: string) => {
        navigateTo('game', gameId);
      }}
      onViewTeacher={() => navigateTo('teacher')}
      onViewLanding={() => navigateTo('landing')}
    />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

