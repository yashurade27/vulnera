"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
  {/* Background with consistent dark color and subtle glow */}
  <div className="absolute inset-0 bg-background" />
  <div className="absolute inset-0 radial-gradient-yellow opacity-40" />
      
      {/* Content */}
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm text-yellow-200 mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Blockchain-powered bug bounty platform</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-medium text-foreground leading-[1.1] mb-6">
              Redefine{" "}
              <span className="inline-flex items-center">
                <span className="text-yellow-400">⚡</span>
              </span>{" "}
              Your Bug Bounty Workflow
            </h1>
            
            <p className="text-base text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Empower your security team with decentralized triage. Vulnera connects elite researchers to your protocol, accelerating disclosure, payout, and patch workflows.
            </p>

            <div className="flex flex-wrap items-center gap-6 mb-10">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <span className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-200 to-gray-500 border-2 border-[#0F172A]" />
                  <span className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-100 to-gray-400 border-2 border-[#0F172A]" />
                  <span className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400/80 to-yellow-500/60 border-2 border-[#0F172A]" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">120k+</p>
                  <p className="text-sm text-muted-foreground">Vulnera hunters across the globe</p>
                </div>
              </div>
              <span className="hidden sm:block h-12 w-px bg-border" aria-hidden="true" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Verified payouts</p>
                <p className="text-lg font-semibold text-foreground">$3.1M distributed</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-10">
              <Button
                asChild
                variant="default"
                size="lg"
                className="group bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
              >
                <Link href="/vulnera" className="inline-flex items-center gap-2">
                  Launch Platform
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-yellow-400 text-yellow-300 hover:bg-yellow-400/20 hover:text-yellow-200"
              >
                <Link href="/vulnera">Browse Bounties</Link>
              </Button>
            </div>
            
            <Card className="bg-card/50 border-border backdrop-blur-md max-w-lg">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground text-xl ">Vulnera Control Hub</CardTitle>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </div>
                <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                  Assign reports, automate payouts, and surface insights from every submission in one workspace designed for fast-moving Web3 teams.
                </CardDescription>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Active programs</p>
                    <p className="text-2xl font-semibold text-foreground">87</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Median resolution</p>
                    <p className="text-2xl font-semibold text-foreground">36 hrs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Right Side - Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-md aspect-square">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <div
                    className="absolute inset-0 rounded-full border border-yellow-400/40 animate-spin-slow"
                    style={{ animationDuration: "18s" }}
                  />
                  <div
                    className="absolute inset-6 rounded-full border border-white/20 animate-spin-slow"
                    style={{ animationDuration: "14s", animationDirection: "reverse" }}
                  />
                  <div
                    className="absolute inset-12 rounded-full border border-white/10 animate-spin-slow"
                    style={{ animationDuration: "10s" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-200 to-yellow-500 shadow-[0_0_60px_rgba(245,233,66,0.35)]" />
                  </div>
                </div>
              </div>
            </div>

            <Card className="absolute -right-4 top-1/2 w-64 -translate-y-1/2 bg-gradient-to-br from-yellow-300 to-yellow-400 text-gray-900 shadow-xl">
              <CardContent className="relative space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium">May 2025</p>
                  <p className="text-4xl font-semibold">5.24k</p>
                  <p className="text-sm">Valid reports processed this month</p>
                </div>
                <svg viewBox="0 0 200 80" className="w-full h-20">
                  <path
                    d="M0,60 Q40,30 80,45 T160,30"
                    fill="none"
                    stroke="#111827"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx="120" cy="40" r="6" fill="#111827" />
                </svg>
                <Button
                  size="icon"
                  className="absolute -top-4 -right-4 rounded-full bg-gray-900 text-yellow-300 hover:bg-gray-800"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
