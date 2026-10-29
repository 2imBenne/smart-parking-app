import React from 'react';
import { Outlet } from 'react-router-dom';
import { LandingNavbar } from './LandingNavbar';
import { LandingFooter } from './LandingFooter';

export const LandingLayout: React.FC = () => {
  return (
    <div className="bg-background text-on-background font-body-md antialiased overflow-x-hidden selection:bg-secondary-container selection:text-on-secondary-container min-h-screen flex flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  );
};
