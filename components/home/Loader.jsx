"use client";
import { useEffect, useState } from "react";

export default function Loader({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0C] flex items-center justify-center">
        <h1 className="text-5xl text-[#D4AF37] animate-pulse">ST ÉTOILE</h1>
      </div>
    );
  }

  return children;
}
