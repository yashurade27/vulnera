"use client";

import { motion } from "framer-motion";
import { Shield, Lock, TrendingUp, Bug, Zap, Award } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const blogs = [
  {
    title: "Top 10 Critical Vulnerabilities in 2025",
    description: "A comprehensive analysis of the most severe security flaws discovered this year",
    icon: Bug,
    tags: ["#security", "#research"],
    color: "red"
  },
  {
    title: "Smart Contract Security Best Practices",
    description: "Essential guidelines for auditing blockchain applications",
    icon: Lock,
    tags: ["#blockchain", "#audit"],
    color: "blue"
  },
  {
    title: "How to Maximize Your Bug Bounty Earnings",
    description: "Pro tips from top researchers on finding high-value vulnerabilities",
    icon: TrendingUp,
    tags: ["#bounty", "#tips"],
    color: "green"
  },
  {
    title: "Web3 Security Landscape 2025",
    description: "Emerging threats and security trends in decentralized applications",
    icon: Shield,
    tags: ["#web3", "#trends"],
    color: "purple"
  },
  {
    title: "Responsible Disclosure Guidelines",
    description: "Best practices for reporting vulnerabilities ethically and safely",
    icon: Award,
    tags: ["#ethics", "#disclosure"],
    color: "yellow"
  },
  {
    title: "Lightning-Fast Bug Hunting Techniques",
    description: "Advanced methodologies to discover vulnerabilities efficiently",
    icon: Zap,
    tags: ["#techniques", "#speed"],
    color: "orange"
  },
];

const colorClasses = {
  red: "from-red-500/20 to-red-600/20 border-red-500/30",
  blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
  green: "from-green-500/20 to-green-600/20 border-green-500/30",
  purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
  yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
  orange: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
};

const iconColors = {
  red: "text-red-400",
  blue: "text-blue-400",
  green: "text-green-400",
  purple: "text-purple-400",
  yellow: "text-yellow-400",
  orange: "text-orange-400",
};

export function BlogSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-950 via-indigo-900 to-purple-950 text-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title font-serif text-white mb-4">
            Recent Vulnerability Reports
          </h2>
          <p className="text-xs text-gray-200 max-w-2xl mx-auto">
            Stay ahead with the latest vulnerability analyses and security trends
          </p>
        </div>
        
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog, index) => {
            const Icon = blog.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="group cursor-pointer overflow-hidden bg-white/10 border-white/20 backdrop-blur-sm">
                  <div
                    className={`relative h-48 bg-gradient-to-br ${colorClasses[blog.color as keyof typeof colorClasses]} flex items-center justify-center`}
                  >
                    <Icon className={`w-20 h-20 ${iconColors[blog.color as keyof typeof iconColors]}`} />
                  </div>
                  <CardContent>
                    <h3 className="text-lg font-serif mb-1 group-hover:text-yellow-300 transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-xs text-gray-200 mb-4">
                      {blog.description}
                    </p>
                    <div className="flex gap-2">
                      {blog.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-white">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
        
        <div className="text-center mt-12">
          <Link href="/vulnera" passHref>
            <Button asChild variant="default" size="lg">
              <a>Explore All Articles</a>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
