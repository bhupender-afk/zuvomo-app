import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer?: string;
}

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      question: "How does Zuvomo grade startups?",
      answer: "We use a comprehensive evaluation framework that includes market analysis, team assessment, technology review, and business model validation."
    },
    {
      question: "What are the winning token sale strategies?",
      answer: "Successful token sales require proper tokenomics design, community building, regulatory compliance, and strategic marketing."
    },
    {
      question: "What do VCs appreciate the most?",
      answer: "VCs value strong founding teams, clear market opportunity, scalable business models, and demonstrable traction."
    },
    {
      question: "Launch is overwhelming. Where do I get started from?",
      answer: "Start with our startup evaluation process, then connect with our advisory team for a customized roadmap."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full py-12">
      <section className="w-full bg-[#F6F7FA] px-4 md:px-8 py-12">
        <h2 className="text-3xl md:text-4xl text-[#1a1a1a] font-bold text-center leading-tight mb-4">
          Frequently Asked Questions
        </h2>
        
        <p className="text-base text-[#555555] text-center leading-relaxed max-w-3xl mx-auto mb-10">
          As a leading digital marketing agency, we are dedicated to providing comprehensive educational
          <br className="hidden md:block" />
          resources and answering frequently asked questions to help our clients.
        </p>
        
        <div className="max-w-5xl mx-auto space-y-1">
          {faqItems.map((item, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-lg overflow-hidden transition-all duration-300 ${
                index === 0 ? 'rounded-t-lg' : ''
              } ${
                index === faqItems.length - 1 ? 'rounded-b-lg' : ''
              } shadow-sm hover:shadow-md`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex justify-between items-center p-6 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="text-lg text-[#1a1a1a] font-semibold pr-4 leading-relaxed">
                  {item.question}
                </span>
                <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center transition-transform duration-500 ease-out ${
                  openIndex === index ? 'rotate-180' : ''
                }`}>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    className="text-[#333333]"
                  >
                    <path 
                      d="M4 6L8 10L12 6" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>
              
              <div className={`transition-all duration-500 ease-out overflow-hidden ${
                openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}>
                {item.answer && (
                  <div className="px-6 pb-6 pt-0">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-base text-[#555555] leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default FAQ;