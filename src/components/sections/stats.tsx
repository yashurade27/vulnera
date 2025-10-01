"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DollarSign, Users, Bug, TrendingUp } from "lucide-react";

function CountUpNumber({ end, duration = 2, prefix = "", suffix = "" }: { 
  end: number; 
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <>{prefix}{count.toLocaleString()}{suffix}</>;
}

export function StatsSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 radial-gradient-yellow" />
      
      <div className="container-custom relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-medium mb-6 leading-tight">
            Join the Security Revolution
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            Be part of a growing community making the digital world safer, one bug at a time
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-3xl lg:text-4xl font-medium text-gradient mb-2">
              $<CountUpNumber end={2500000} duration={2} />
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Total Rewards Paid</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-3xl lg:text-4xl font-medium text-gradient mb-2">
              <CountUpNumber end={542} duration={2} />+
            </div>
            <div className="text-sm text-muted-foreground">Active Researchers</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bug className="w-6 h-6 text-red-400" />
            </div>
            <div className="text-3xl lg:text-4xl font-medium text-gradient mb-2">
              <CountUpNumber end={1247} duration={2} />
            </div>
            <div className="text-sm text-muted-foreground">Bugs Discovered</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-xl transition-all"
          >
            <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-3xl lg:text-4xl font-medium text-gradient mb-2">
              <CountUpNumber end={142} duration={2} />
            </div>
            <div className="text-sm text-muted-foreground">Active Bounties</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
