import type { Player } from "../../../../packages/shared/src"

// Mirrored 4-3-3 facing left (IDs 101-111 to avoid collision with home team)
export const defaultLineupOpposition: Player[] | (() => Player[]) = () => [
    { id: 101, x: 95, y: 50, number: 1 },   // GK
    { id: 102, x: 80, y: 15, number: 2 },   // RB
    { id: 103, x: 80, y: 35, number: 5 },   // CB
    { id: 104, x: 80, y: 65, number: 6 },   // CB
    { id: 105, x: 80, y: 85, number: 3 },   // LB
    { id: 106, x: 55, y: 35, number: 4 },   // CM
    { id: 107, x: 55, y: 65, number: 8 },   // CM
    { id: 108, x: 35, y: 20, number: 7 },   // RW
    { id: 109, x: 35, y: 50, number: 10 },  // CAM
    { id: 110, x: 35, y: 80, number: 11 },  // LW
    { id: 111, x: 20, y: 50, number: 9 },   // ST
]
