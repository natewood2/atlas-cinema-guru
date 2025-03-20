"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  if (status === "unauthenticated") {
    redirect("/login");
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header userName={session?.user?.name || "User"} userEmail={session?.user?.email || ""} />
      <div className="md:hidden">
        <Sidebar />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:block h-full">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto bg-[#00003c] p-6">
          {children}
        </main>
      </div>
    </div>
  );
}