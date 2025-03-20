"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface HeaderProps {
  userName: string;
  userEmail: string;
}

export default function Header({ userName, userEmail }: HeaderProps) {
  return (
    <header className="bg-[#1ED2AF] text-[#00003c] p-4 flex justify-between items-center">
      <div className="flex items-center">
        <svg width="30" height="30" viewBox="0 0 39 39" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
          <path d="M11.375 6.5V32.5M27.625 6.5V32.5M4.875 13H11.375M27.625 13H34.125M4.875 19.5H34.125M4.875 26H11.375M27.625 26H34.125M6.5 32.5H32.5C33.3975 32.5 34.125 31.7725 34.125 30.875V8.125C34.125 7.22754 33.3975 6.5 32.5 6.5H6.5C5.60254 6.5 4.875 7.22754 4.875 8.125V30.875C4.875 31.7725 5.60254 32.5 6.5 32.5Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <h1 className="text-xl font-bold">Cinema Guru</h1>
      </div>
      
      <div className="flex items-center">
        <div className="mr-4">
          Welcome, {userEmail}
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </header>
  );
}