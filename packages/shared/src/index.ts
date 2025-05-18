export interface Player {
  id: number;
  x: number;
  y: number;
  number: number;
}

export interface TacticFormData {
  title: string;
  formation: string;
  tags: string[];
  description: string;
}
