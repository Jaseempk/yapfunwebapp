"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import SearchBar from "./SearchBar";
import { useSearch } from "../providers/SearchProvider";

interface MobileSearchDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearchDropdown({
  isOpen,
  onClose,
}: MobileSearchDropdownProps) {
  const [isMobile, setIsMobile] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  
  // Track if we're currently interacting with the search input
  const [isInteractingWithSearch, setIsInteractingWithSearch] = useState(false);

  // Check if we're on mobile based on screen width
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is the md breakpoint in Tailwind
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Handle outside clicks
  useEffect(() => {
    if (!isOpen) return;

    // This function handles clicks outside the dropdown
    const handleOutsideClick = (e: MouseEvent) => {
      // Don't close if we're interacting with the search input
      if (isInteractingWithSearch) return;
      
      // Check if click is outside the dropdown
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    // Add event listeners with a delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener("click", handleOutsideClick);
    }, 300);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [isOpen, onClose, isInteractingWithSearch]);

  // Handle search input interactions
  const handleSearchFocus = () => {
    setIsInteractingWithSearch(true);
  };

  const handleSearchBlur = () => {
    // Small delay to allow for input interactions
    setTimeout(() => {
      setIsInteractingWithSearch(false);
    }, 200);
  };

  return (
    <AnimatePresence>
      {isOpen && isMobile && (
        <motion.div
          ref={dropdownRef}
          className="absolute top-16 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center">
              <div 
                className="flex-1" 
                ref={inputRef}
                onMouseDown={handleSearchFocus}
                onMouseUp={handleSearchFocus}
                onTouchStart={handleSearchFocus}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              >
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="w-full"
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="ml-2 p-2 rounded-full hover:bg-secondary/50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
