"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Story } from "@/data/mockStories";

interface StoryModalContextType {
  selectedStory: Story | null;
  isOpen: boolean;
  openStoryModal: (story: Story) => void;
  closeStoryModal: () => void;
}

const StoryModalContext = createContext<StoryModalContextType>({
  selectedStory: null,
  isOpen: false,
  openStoryModal: () => {},
  closeStoryModal: () => {},
});

export function StoryModalProvider({ children }: { children: React.ReactNode }) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openStoryModal = useCallback((story: Story) => {
    setSelectedStory(story);
    setIsOpen(true);
  }, []);

  const closeStoryModal = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setSelectedStory(null);
    }, 200);
  }, []);

  // Cerrar modal al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeStoryModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeStoryModal]);

  return (
    <StoryModalContext.Provider
      value={{
        selectedStory,
        isOpen,
        openStoryModal,
        closeStoryModal,
      }}
    >
      {children}
    </StoryModalContext.Provider>
  );
}

export function useStoryModal() {
  return useContext(StoryModalContext);
}
