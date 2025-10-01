"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield, Bug, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
  {/* Background with gradient + subtle grid */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#16213C] to-[#1E293B]" />
  <div className="absolute inset-0 grid-pattern opacity-30" />
      
      {/* Content */}
      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="security-badge mb-6 text-gray-200">
              <Shield className="w-5 h-5 text-yellow-300" />
              <span>Blockchain-Powered Bug Bounty Platform</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-serif font-semibold text-white leading-tight mb-6">
              Fortify Web3 Security{" "}
              <span className="inline-flex items-center">
                <span className="text-yellow-400">⚡</span>
              </span>{" "}
              with Vulnera Hunters
            </h1>
            
            <p className="text-sm text-gray-200/90 mb-8 max-w-md">
              A decentralized bug bounty ecosystem connecting elite researchers with protocols. Submit responsibly, earn faster, and strengthen every release.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/vulnera" passHref>
                <Button
                  asChild
                  variant="default"
                  size="lg"
                  className="group bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-300 hover:to-yellow-400"
                >
                  <a className="inline-flex items-center gap-2">
                    Launch Platform
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </Link>
              <Link href="/vulnera" passHref>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-yellow-400 text-yellow-300 hover:bg-yellow-400/20 hover:text-yellow-200"
                >
                  <a>Browse Bounties</a>
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="flex gap-8 text-gray-200">
              <div>
                <div className="text-3xl font-bold text-white">$2.5M+</div>
                <div className="text-sm text-gray-300">Rewards Paid</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-gray-300">Security Researchers</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">1,200+</div>
                <div className="text-sm text-gray-300">Bugs Found</div>
              </div>
            </div>
          </motion.div>
          
          {/* Right Side - 3D Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Bug Bounty Card */}
            <Card className="mb-4 bg-white/5 border-white/10">
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <Bug className="w-8 h-8 text-yellow-400" />
                  <div>
                    <CardTitle className="text-white">Bug Bounty Program</CardTitle>
                    <CardDescription className="text-gray-300">
                      Discover vulnerabilities and get rewarded
                    </CardDescription>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Card className="bg-white/5 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-300">142</div>
                    <div className="text-xs text-gray-300">Active Bounties</div>
                  </Card>
                  <Card className="bg-white/5 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-300">$450K</div>
                    <div className="text-xs text-gray-300">Total Pool</div>
                  </Card>
                </div>
              </CardContent>
            </Card>
            
            {/* Stats Card - Yellow */}
            <Card className="bg-yellow-400/90 text-black">
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium mb-2">This Month</div>
                    <div className="text-4xl font-bold mb-1">324</div>
                    <div className="text-sm">Vulnerabilities Reported</div>
                  </div>
                  <Award className="w-8 h-8" />
                </div>
                <div className="mt-4 h-2 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-black/60 rounded-full"></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
