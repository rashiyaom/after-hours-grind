import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface PageTitleProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

export function PageTitle({
  title,
  subtitle,
  icon = <Sparkles className="h-8 w-8 text-neon-green" />,
}: PageTitleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <h1 className="inline-flex items-center gap-3 text-4xl font-bold tracking-tighter text-white sm:text-5xl font-display">
        {icon}
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-400">
        {subtitle}
      </p>
    </motion.div>
  );
}
