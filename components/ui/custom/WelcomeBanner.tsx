"use client"    
import { useUser } from '@clerk/nextjs';
import { Sparkle } from 'lucide-react';
import React from 'react'
import CreateNewBoardDialog from './createNewBoardDialog';
function WelcomeBanner() {
    const {user} =  useUser();
  return (
    <div>   
        <div className=" p-10 border rounded-xl bg-gradient-to-r from-blue-200 to-purple-200 gp-3">
            <h2 className="text-2xl font-bold ">Welcome, {user?.firstName}!</h2>
            <p>Bring your ideas to life with our powerful project management tools.</p>
            <div className="flex items-center gap-2 mt-5">
                 <CreateNewBoardDialog />
                <button className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50">
                    <Sparkle className="h-4 w-4" />
                    AI helper
                </button>
            </div>
        </div>
    </div>
  )
}


export default WelcomeBanner
