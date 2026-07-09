import * as React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      {/* Sidebar - responsive navigation panel */}
      <Sidebar />

      {/* Main body area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar - header bar containing search, notifications and user settings */}
        <Topbar />

        {/* Page children container */}
        <div className="flex-1 p-6 overflow-y-auto bg-gradient-bg">
          {children}
        </div>
      </div>
    </div>
  );
}
