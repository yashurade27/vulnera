"use client";

import { motion } from "framer-motion";
import { Wallet } from "lucide-react";

const steps = [
  { number: "01", title: "Connect Wallet", description: "Link your Solana wallet to get started" },
  { number: "02", title: "Browse Bounties", description: "Find programs matching your expertise" },
  { number: "03", title: "Submit Findings", description: "Report vulnerabilities securely", highlighted: true },
  { number: "04", title: "Get Rewarded", description: "Receive instant crypto payments" },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container-custom">
        <h2 className="text-4xl lg:text-5xl font-medium text-center mb-6 leading-tight">How It All Works</h2>
        <p className="text-center text-muted-foreground mb-16 text-base leading-relaxed">
          Getting started with Vulnera is simple and secure
        </p>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Left Side - Steps 1-2 */}
            <div className="space-y-6">
              {steps.slice(0, 2).map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4 bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-all"
                >
                  <div className="step-circle font-mono">{step.number}</div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Right Side - Steps 3-4 */}
            <div className="space-y-6">
              {steps.slice(2, 4).map((step, index) => (
                <motion.div
                  key={index + 2}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: (index + 2) * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex items-start gap-4 p-6 rounded-xl border transition-all ${
                    step.highlighted 
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-gray-900 border-yellow-600' 
                      : 'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`step-circle ${step.highlighted ? 'border-gray-900 text-gray-900' : ''}`}>
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-1">{step.title}</h3>
                    <p className={step.highlighted ? "text-gray-900/80" : "text-muted-foreground"}>
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Center - Circle Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative flex items-center justify-center py-12"
          >
            <div className="relative w-64 h-64 rounded-full border-2 border-border flex items-center justify-center bg-card/50 backdrop-blur-sm">
              <div className="text-center">
                <Wallet className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <div className="text-sm text-muted-foreground mb-2">Follow these</div>
                <div className="text-lg font-medium">easy steps</div>
              </div>
              
              {/* Step dots around circle */}
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute step-circle"
                  style={{
                    top: `${50 + 45 * Math.sin((i * Math.PI) / 2 - Math.PI / 2)}%`,
                    left: `${50 + 45 * Math.cos((i * Math.PI) / 2 - Math.PI / 2)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  0{i + 1}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
