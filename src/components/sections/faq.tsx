"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const faqs = [
  {
    question: "How do I start a bug bounty program?",
    answer:
      "Sign up as a company, create a new program listing your scope and rewards, then publish it. Security researchers can then submit vulnerability reports.",
  },
  {
    question: "How are payouts processed?",
    answer:
      "Once a vulnerability is verified by the triage team, rewards are automatically transferred to the researcher’s connected wallet via our smart contract.",
  },
  {
    question: "What are the supported blockchains?",
    answer:
      "Vulnera currently supports Ethereum and Solana networks for bounty programs. More chains coming soon.",
  },
  {
    question: "Is my data secure?",
    answer:
      "All communications and reports are encrypted end-to-end. We use decentralized storage for sensitive details.",
  },
];

export function FAQSection() {
  return (
    <section className="py-24">
      <div className="container-custom">
        <h2 className="section-title text-center mb-8">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, idx) => (
            <AccordionItem value={`item-${idx}`} key={idx}>
              <AccordionTrigger className="text-lg text-foreground">{faq.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
