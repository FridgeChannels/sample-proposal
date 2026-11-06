"use client";

import { motion } from "framer-motion";
import { Home, Radio } from "lucide-react";

import { cn } from "../../lib/utils";
import "./bottom-nav-bar.css";

type BottomNavBarProps = {
  className?: string;
  stickyBottom?: boolean;
  activeView: "live" | "about" | "contact";
  onLive: () => void;
  onAbout: () => void;
  onContact: () => void;
};

export function BottomNavBar({
  className,
  stickyBottom = false,
  activeView,
  onLive,
  onAbout,
  onContact,
}: BottomNavBarProps) {
  return (
    <motion.nav
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label="Bottom Navigation"
      className={cn(
        "bottom-nav-bar",
        stickyBottom && "bottom-nav-bar--sticky",
        className,
      )}
    >
      <motion.button
        whileTap={{ scale: 0.97 }}
        className={cn("bottom-nav-button", activeView === "live" && "is-active")}
        onClick={onLive}
        aria-label="Consumer Experience"
        aria-pressed={activeView === "live"}
        type="button"
      >
        <Radio size={22} strokeWidth={2} aria-hidden className="bottom-nav-icon" />
        <span className="bottom-nav-label">Consumer Experience</span>
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.97 }}
        className={cn("bottom-nav-button", activeView === "about" && "is-active")}
        onClick={onAbout}
        aria-label="About Hommio"
        aria-pressed={activeView === "about"}
        type="button"
      >
        <Home size={22} strokeWidth={2} aria-hidden className="bottom-nav-icon" />
        <span className="bottom-nav-label">About Hommio</span>
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.97 }}
        className={cn("bottom-nav-button", activeView === "contact" && "is-active")}
        onClick={onContact}
        aria-label="Contact Hommio"
        aria-pressed={activeView === "contact"}
        type="button"
      >
        <img src="/assets/contact/contact.svg" width={22} height={22} alt="" className="bottom-nav-icon" />
        <span className="bottom-nav-label">Contact Hommio</span>
      </motion.button>
    </motion.nav>
  );
}

export default BottomNavBar;
