"use client";

import { usePathname } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollButtons from "@/components/ScrollButtons";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();

  const isDashboard = pathname?.startsWith("/dashboard");

  // Dashboard হলে Website Navbar/Footer দেখাবে না
  if (isDashboard) {
    return <>{children}</>;
  }

  // Website pages
  return (
    <>
      <Navbar />

      {children}

      <Footer />

      <ScrollButtons />
    </>
  );
}
