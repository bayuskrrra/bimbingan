import React from 'react';
import { Menu } from 'lucide-react';

export const Navbar = ({ onOpenSidebar }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-base font-bold text-slate-800">
            Sistem Bimbingan &amp; Konseling
          </h2>
          <p className="text-xs text-slate-500">
            Portal Rekapitulasi Tata Tertib &amp; Intervensi Siswa
          </p>
        </div>
      </div>
    </header>
  );
};
