import { useState } from "react";

export interface TacticFormData {
  title: string;
  description: string;
  formation: string;
  tags: string[];
}

export const useTacticsForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formation, setFormation] = useState("4-3-3");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFormation("4-3-3");
    setTags([]);
    setLoading(false);
  };

  const getFormData = (): TacticFormData => ({
    title,
    description,
    formation,
    tags,
  });

  const isFormValid = () => {
    return (
      title.trim().length >= 3 &&
      description.trim().length >= 10 &&
      /^\d+-\d+(-\d+)*$/.test(formation)
    );
  };

  // Expose selectedOptions as tags alias for backwards compat with TacticDetails
  const selectedOptions = tags;

  return {
    // Form state
    title,
    setTitle,
    description,
    setDescription,
    formation,
    setFormation,
    tags,
    setTags,
    selectedOptions,
    loading,
    setLoading,

    // Actions
    resetForm,
    getFormData,
    isFormValid,
  };
};