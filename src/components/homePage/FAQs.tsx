"use client"
import MinusIcon from "@/assets/icons/minus.svg"
import PlusIcon from "@/assets/icons/plus.svg"
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const items = [
  {
    question: "Is MindMate completely anonymous?",
    answer:
      "Yes. You can connect without sharing personal details. Your identity is never revealed to listeners or other users.",
  },
  {
    question: "Who are the listeners on MindMate?",
    answer:
      "Listeners are volunteers who join to provide support. They are not professional therapists, but they offer a safe space to talk and be heard.",
  },
  {
    question: "What if I need urgent help?",
    answer:
      "MindMate is not a crisis hotline. If you are in immediate danger or having suicidal thoughts, please contact local emergency services or a trusted crisis helpline right away.",
  },
  {
    question: "Does it cost anything to use?",
    answer:
      "No, MindMate is free to use. Our goal is to make emotional support accessible to everyone.",
  },
  {
    question: "Can I also become a listener?",
    answer:
      "Yes. Anyone can sign up as a listener after agreeing to our community guidelines. It’s a great way to support others.",
  },
];

const AccordionItem = ({ item }: { item: { question: string; answer: string } }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      className="py-6 border-b border-white/30 cursor-pointer"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex items-center">
        <span className="flex-1 text-base sm:text-lg font-semibold sm:font-bold leading-snug">
          {item.question}
        </span>
        {isOpen ? <MinusIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: "12px" }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="text-sm sm:text-base text-gray-200 leading-relaxed"
          >
            {item.answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FAQs = () => {
  return (
    <div className="bg-black text-white bg-gradient-to-b from-[#5d2cab] to-black py-16 sm:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-3xl sm:text-5xl sm:max-w-[648px] mx-auto font-bold tracking-tight">
          Frequently asked questions
        </h2>
        <div className="mt-10 sm:mt-12 max-w-[648px] mx-auto">
          {items.map((item, index) => (
            <AccordionItem key={index} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};
