'use client';

import { motion } from 'framer-motion';

export default function IconButton({ isOpen, toggleSidebar }) {
  return (
    <motion.button
      onClick={toggleSidebar}
      className="fixed top-4 left-4 z-20 p-2 rounded-lg bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-700/40 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-6 h-5 flex flex-col justify-between"
        animate={isOpen ? "open" : "closed"}
      >
        <motion.span
          className="w-full h-0.5 bg-slate-300/70 block"
          variants={{
            closed: { rotate: 0, translateY: 0 },
            open: { rotate: 45, translateY: 10 }
          }}
        />
        <motion.span
          className="w-full h-0.5 bg-slate-300/70 block"
          variants={{
            closed: { opacity: 1 },
            open: { opacity: 0 }
          }}
        />
        <motion.span
          className="w-full h-0.5 bg-slate-300/70 block"
          variants={{
            closed: { rotate: 0, translateY: 0 },
            open: { rotate: -45, translateY: -10 }
          }}
        />
      </motion.div>
    </motion.button>
  );
}