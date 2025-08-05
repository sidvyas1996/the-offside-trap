import { useState } from "react";

export interface TacticFormData {
  title: string;
  description: string;
  selectedOptions: string[];
}

export const useTacticsForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedOptions] = useState(["motion graphic", "defending"]);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLoading(false);
  };

  const getFormData = (): TacticFormData => ({
    title,
    description,
    selectedOptions,
  });

  const isFormValid = () => {
    return title.trim().length > 0 && description.trim().length > 0;
  };

  return {
    // Form state
    title,
    setTitle,
    description,
    setDescription,
    selectedOptions,
    loading,
    setLoading,
    
    // Actions
    resetForm,
    getFormData,
    isFormValid,
  };
}; 