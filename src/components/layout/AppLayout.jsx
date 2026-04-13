import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar - cachée sur mobile pour le moment */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        
        {/* Main Scrollable Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* L'Outlet injecte la page active selon l'URL */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}