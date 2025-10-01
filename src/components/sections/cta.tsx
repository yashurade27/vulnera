"use client";

import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-yellow-500/5 to-transparent" />
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full">
            <Shield className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Start Your Journey Today</span>
          </div>
          
          <h2 className="section-title mb-6">
            Ready to Secure the Future?
          </h2>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of security researchers earning rewards while making 
            the digital world safer. Connect your wallet and start hunting bugs today.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/vulnera">
              <button className="btn-wallet group">
                Launch Platform
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/vulnera">
              <button className="btn-primary px-8 py-4 text-lg">
                View Documentation
              </button>
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Secured by Solana</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span>Audited Smart Contracts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
              <span>Community Driven</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
