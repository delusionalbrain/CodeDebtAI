'use client';

import React, { useEffect, useState } from 'react';
import { Download, Folder, Loader2 } from 'lucide-react'; // Added Loader2 for downloading state
import { DashboardTelemetry } from '@/types/dashboard';

export function Header() {
  const [dashboardData, setDashboardData] = useState<DashboardTelemetry | null>(null);
  const [repoName, setRepoName] = useState<string>("Repository");
  const [isDownloading, setIsDownloading] = useState<boolean>(false); // Added loading state

  useEffect(() => {
    const saved = sessionStorage.getItem("dashboardData");
    if (saved) {
      try {
        const data = JSON.parse(saved) as DashboardTelemetry;
        setDashboardData(data);
        
        const repoUrl = sessionStorage.getItem("repoUrl");
        if (repoUrl) {
          const parts = repoUrl.replace(/\/$/, '').split('/');
          const name = parts[parts.length - 1].replace('.git', '');
          setRepoName(name || "Scanned Repository");
        } else {
          setRepoName("Scanned Repository");
        }
      } catch (e) {
        console.error("Failed to parse dashboard data for header", e);
      }
    }
  }, []);

  // --- UPDATED DOWNLOAD FUNCTION FOR PDF EXPORT ---
  const handleDownloadReport = async () => {
    if (!dashboardData) return;
    setIsDownloading(true);

    try {
      // Fetch the binary file stream from your backend route
      const response = await fetch("http://127.0.0.1:8000/export-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoName: repoName,
          dashboardData: dashboardData, // Send all raw telemetry so the backend can extract metrics
        }),
      });

      if (!response.ok) {
        throw new Error("Could not construct PDF from backend data.");
      }

      // Convert the response to a Blob (Binary Large Object) representing the PDF
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Ephemeral link creation to download file in-browser
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = downloadUrl;
      downloadAnchor.setAttribute("download", `${repoName}-analysis-report.pdf`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      
      // Clean up DOM objects
      downloadAnchor.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Something went wrong compiling your PDF report. Check if your backend server is running.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-900 bg-[#0B0F19]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-10 w-full select-none">
      {/* Left section: Active repository title */}
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded bg-slate-900 border border-slate-850 text-slate-400">
          <Folder className="w-4.5 h-4.5" />
        </div>
        <span className="text-white font-bold text-sm tracking-wide">{repoName}</span>
      </div>

      {/* Right section: Prominent Download Report button */}
      <div>
        <button
          onClick={handleDownloadReport}
          disabled={isDownloading || !dashboardData}
          className="px-4 py-2 rounded-lg text-white font-bold text-xs tracking-wide bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 border border-violet-500/20 shadow-[0_4px_20px_rgba(139,92,246,0.15)] hover:shadow-[0_4px_25px_rgba(139,92,246,0.35)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF Report</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}