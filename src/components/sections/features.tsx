"use client";

import { motion } from "framer-motion";
import { Shield, DollarSign, Lock, Users, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Blockchain Security",
    description: "Immutable smart contracts ensure transparent and secure reward distribution",
    highlighted: false
  },
  {
    icon: DollarSign,
    title: "Instant Payouts",
    description: "Get paid directly to your wallet once vulnerabilities are verified and approved",
    highlighted: true
  },
  {
    icon: Lock,
    title: "Private Disclosure",
    description: "Secure encrypted communication channels for responsible vulnerability disclosure",
    highlighted: false
  },
  {
    icon: Users,
    title: "Global Community",
    description: "Join thousands of security researchers helping build a safer internet",
    highlighted: false
  },
  {
    icon: Zap,
    title: "Fast Resolution",
    description: "Streamlined workflow from submission to verification to payment",
    highlighted: false
  },
  {
    icon: TrendingUp,
    title: "Build Reputation",
    description: "Earn badges and climb leaderboards as you discover more vulnerabilities",
    highlighted: false
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 relative">
      <div className="container-custom">
        <h2 className="text-4xl lg:text-5xl font-medium text-center mb-6 ">
          How Vulnera{" "}
          <span className="inline-flex items-center">
            <span className="text-yellow-400">⚡</span>
          </span>{" "}
          Transforms
        </h2>
        <p className="text-center text-muted-foreground mb-16 text-lg max-w-3xl mx-auto leading-relaxed">
          A decentralized approach to{" "}
          <span className="text-yellow-400 font-semibold">security research</span>{" "}
          that benefits everyone
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={feature.highlighted ? "process-card highlighted" : "process-card"}
              >
                <div className="icon-3d mb-6 animate-float">
                  <Icon className={`w-8 h-8 ${feature.highlighted ? 'text-gray-900' : 'text-yellow-400'}`} />
                </div>
                
                <h3 className="text-xl font-medium mb-3">{feature.title}</h3>
                <p className={`text-sm leading-relaxed ${feature.highlighted ? "text-gray-900/80" : "text-muted-foreground"}`}>
                  {feature.description}
                </p>
                
                {feature.highlighted && (
                  <Link href="/vulnera">
                    <Button variant="ghost" size="icon" className="mt-6">
                      <span className="text-xl">→</span>
                    </Button>
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
