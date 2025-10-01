"use client";

import Link from "next/link";
import { Shield, Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-yellow-400" />
              <span className="text-xl font-bold">Vulnera</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Decentralized bug bounty platform built on Solana. Secure the web, earn rewards.
            </p>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="mailto:contact@vulnera.com" className="text-muted-foreground hover:text-foreground transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-bold mb-4">Platform</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">Browse Bounties</Link></li>
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">Submit Report</Link></li>
              <li><Link href="/account" className="text-muted-foreground hover:text-foreground transition-colors">Leaderboard</Link></li>
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">API Reference</Link></li>
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">Security Policy</Link></li>
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">Bug Reports</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">Blog</Link></li>
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">Careers</Link></li>
              <li><Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Vulnera. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/vulnera" className="text-muted-foreground hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
