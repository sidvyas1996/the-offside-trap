import React from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import type { TacticFormData } from "../../hooks/useTacticsForm";

interface TacticDetailsProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  selectedOptions: string[];
  loading: boolean;
  onSubmit: () => void;
}

const TacticDetails: React.FC<TacticDetailsProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  selectedOptions,
  loading,
  onSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Save className="h-5 w-5 text-[var(--primary)]" />
        Tactic Details
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="title" className="text-sm">Tactic Title</Label>
          <Textarea
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. High Press Counter Attack"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="description" className="text-sm">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your tactical approach..."
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm">Selected Options</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedOptions.map((opt, idx) => (
              <Badge key={idx} className="bg-purple-600 text-white text-xs">
                {opt}
              </Badge>
            ))}
          </div>
        </div>

        <Button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Tactic...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Create Tactic
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default TacticDetails; 