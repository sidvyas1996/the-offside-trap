import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface CreateTacticsContextType {
  currentStep: string;
  setCurrentStep: (step: string) => void;
  isFinalStep: boolean;
}

const CreateTacticsContext = createContext<CreateTacticsContextType | undefined>(undefined);

export const useCreateTactics = () => {
  const context = useContext(CreateTacticsContext);
  if (!context) {
    throw new Error("useCreateTactics must be used within a CreateTacticsProvider");
  }
  return context;
};

interface CreateTacticsProviderProps {
  children: ReactNode;
}

export const CreateTacticsProvider: React.FC<CreateTacticsProviderProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<string>("start");

  const isFinalStep = currentStep === "final";

  return (
    <CreateTacticsContext.Provider value={{ currentStep, setCurrentStep, isFinalStep }}>
      {children}
    </CreateTacticsContext.Provider>
  );
}; 