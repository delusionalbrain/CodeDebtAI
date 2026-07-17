'use client';

import React from 'react';
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Sidebar is locked permanently open (sticky)
  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100 flex font-sans overflow-x-hidden w-full relative">
      {/* 1. Global Space Backdrop Glow Nodes inside a boundary-confined wrapper to prevent height overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-violet-950/10 filter blur-[150px] translate-x-[-20%] translate-y-[-20%]" />
        <div className="absolute bottom-0 right-0 w-[550px] h-[550px] rounded-full bg-blue-950/10 filter blur-[130px] translate-x-[20%] translate-y-[20%]" />
      </div>

      {/* Main Navigation Sidebar (Sticky) */}
      <Sidebar />
      
      {/* Workspace Shell Panel (Fixed left spacing offset pl-64) */}
      <div className="flex-grow flex flex-col min-h-screen pl-64 z-10 w-full relative">
        {/* Top navigation actions bar */}
        <Header />
        
        {/* Dashboard viewport slot */}
        <main className="flex-grow p-6 md:p-8 bg-[#05070c]/20 relative w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
