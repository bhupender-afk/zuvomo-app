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
      answer: "At Zuvomo, we grade startups through an intense, data-driven evaluation process designed to identify and validate high-potential Web3 and blockchain projects. Our grading combines advanced AI insights, hands-on advisory experience, and real-time market data to provide a transparent and reliable ranking."
    },
    {
      question: "What are the winning token sale strategies?",
      answer: "We design winning token sale strategies by creating transparent and sustainable tokenomics, building engaged communities early, and planning structured sale phases with fair vesting schedules to ensure market stability. We partner with trusted influencers, launchpads, and market makers to boost credibility and liquidity. "
    },
    {
      question: "What do Investor appreciate the most?",
      answer: "Investors appreciate strong, passionate founding teams; scalable business models targeting large markets; clear proof of concept with measurable traction; transparent execution backed by data; and solutions addressing real-world problems. They value founders who effectively leverage advisory networks and investor validation."
    },
    {
      question: "Launch is overwhelming. Where do I get started from?",
      answer: "If the launch feels overwhelming, start with a clear roadmap, such as defining your project, building a strong and engaged community early, and designing transparent tokenomics. Leverage our expert advisory services and data-driven tools to validate your strategy, connect with trusted startup investors, and optimize your marketing for maximum impact. "
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