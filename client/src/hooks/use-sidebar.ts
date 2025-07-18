import { useState, useEffect } from "react";

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export function useSidebar(): SidebarState {
  const [isOpen, setIsOpen] = useState(() => {
    // Load from localStorage on initialization
    const saved = localStorage.getItem("sidebar-open");
    return saved === null ? true : JSON.parse(saved);
  });

  useEffect(() => {
    // Save to localStorage whenever state changes
    localStorage.setItem("sidebar-open", JSON.stringify(isOpen));
  }, [isOpen]);

  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return { isOpen, toggle, open, close };
}