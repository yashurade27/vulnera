"use client";

import { useState, useEffect } from "react";
import { Menu, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from '@/components/ui/button'

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`nav-glass ${isScrolled ? "shadow-lg" : ""}`}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Shield className="w-8 h-8 text-yellow-400" />
            <span className="text-xl font-semibold">Vulnera</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="link-premium">Home</Link>
            <Link href="/vulnera" className="link-premium">Bounties</Link>
            <Link href="/account" className="link-premium">Leaderboard</Link>
            <Link href="/vulnera" className="link-premium">How It Works</Link>
            <Link href="/vulnera" className="link-premium">Docs</Link>
          </div>
          
          {/* Authentication Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="default">Register</Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-xl"
          >
            <div className="container-custom py-4 space-y-4">
              <Link href="/" className="block link-premium py-2">Home</Link>
              <Link href="/vulnera" className="block link-premium py-2">Bounties</Link>
              <Link href="/account" className="block link-premium py-2">Leaderboard</Link>
              <Link href="/vulnera" className="block link-premium py-2">How It Works</Link>
              <Link href="/vulnera" className="block link-premium py-2">Docs</Link>
              <Link href="/auth/login">
                <Button className="w-full" variant="outline">Login</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="w-full mt-2" variant="default">Register</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
