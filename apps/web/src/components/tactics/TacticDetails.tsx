import React from "react";
import { Save, Loader2, ClipboardList } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";

interface TacticDetailsProps {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  formation?: string;
  setFormation?: (f: string) => void;
  selectedOptions: string[];
  loading: boolean;
  onSubmit: () => void;
}

const TacticDetails: React.FC<TacticDetailsProps> = ({
  title,
  setTitle,
  description,
  setDescription,
  formation,
  setFormation,
  selectedOptions,
  loading,
  onSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--surface-container)", border: "2px solid var(--ink)", boxShadow: "var(--card-shadow)" }}
    >
      <h2 className="panel-title mb-5">
        <span className="icon-chip"><ClipboardList size={14} /></span>
        Tactic Details
      </h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title" className="field-label">Tactic Title</label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. High Press Counter Attack"
          />
        </div>

        <div>
          <label htmlFor="description" className="field-label">Description</label>
          <Textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your tactical approach..."
            className="!rounded-lg !p-3 text-sm"
          />
        </div>

        {setFormation !== undefined && (
          <div>
            <label htmlFor="formation" className="field-label">Formation</label>
            <Input
              id="formation"
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              placeholder="e.g. 4-3-3"
              style={{ fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", letterSpacing: "0.04em" }}
            />
          </div>
        )}

        {selectedOptions.length > 0 && (
          <div>
            <span className="field-label">Selected Options</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedOptions.map((opt, idx) => (
                <span key={idx} className="chip-lime">
                  {opt}
                </span>
              ))}
            </div>
          </div>
        )}

        <Button type="submit" className="btn-primary w-full !rounded-xl" disabled={loading}>
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
