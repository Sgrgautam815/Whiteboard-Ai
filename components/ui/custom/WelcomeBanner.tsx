"use client";

import { useUser } from '@clerk/nextjs';
import { Sparkle } from 'lucide-react';
import React, { useState } from 'react';
import CreateNewBoardDialog from './createNewBoardDialog';
import { AIHelperModal } from './AIHelperModal';

function WelcomeBanner() {
  const { user } = useUser();
  const [aiModalOpen, setAiModalOpen] = useState(false);

  return (
    <div>   
      <div className="p-8 border border-blue-100 rounded-2xl bg-gradient-to-r from-blue-100/80 via-indigo-100/60 to-purple-100/80 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Welcome, {user?.firstName ?? 'User'}!</h2>
        <p className="mt-1 text-slate-600 text-sm">Bring your ideas to life with our powerful project management tools.</p>
        <div className="flex items-center gap-3 mt-6">
          <div className="w-48">
            <CreateNewBoardDialog />
          </div>
          <button
            type="button"
            onClick={() => setAiModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-[0.98]"
          >
            <Sparkle className="h-4 w-4 text-violet-600" />
            <span>AI helper</span>
          </button>
        </div>
      </div>

      <AIHelperModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </div>
  );
}

export default WelcomeBanner;
