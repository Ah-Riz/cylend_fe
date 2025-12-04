import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const LandingFAQ = () => {
  const faqs = [
    {
      question: "What information is protected versus visible?",
      answer: "Cylend protects commercial intent: who lends to whom, the terms of credit, internal memos, and policy criteria. Public settlement records on Mantle show custody flows (escrow in, disbursement out) but not the lender-borrower relationship or decision logic.",
    },
    {
      question: "How does this differ from typical DeFi lending?",
      answer: "Standard DeFi lending (Aave, Compound) exposes all positions, counterparties, and liquidation risks publicly. Cylend separates custody (public on Mantle) from credit logic (confidential on Sapphire), protecting institutional strategy and relationships while maintaining settlement transparency.",
    },
    {
      question: "What networks does Cylend support?",
      answer: "Cylend currently operates on Mantle for asset custody and settlement, with confidential computation powered by Oasis Sapphire. The two chains are bridged securely via Hyperlane for instruction passing and authorization.",
    },
    {
      question: "Is privacy optional or always enabled?",
      answer: "Privacy is always enabled by design. There is no standard versus private mode. All allocation instructions and credit decisions route through the confidential vault on Sapphire, ensuring institutional discretion by default.",
    },
  ];

  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="container mx-auto max-w-3xl">
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-medium">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default LandingFAQ;
