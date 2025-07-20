import type { Player } from "../../../../packages/shared/src"

export const defaultLineupSingle: Player[] | (() => Player[]) =() => {return [
    { id: 1, x: 5, y: 50, number: 1 },
    { id: 2, x: 20, y: 85, number: 2 },
    { id: 3, x: 20, y: 65, number: 5 },
    { id: 4, x: 20, y: 35, number: 6 },
    { id: 5, x: 20, y: 15, number: 3 },
    { id: 6, x: 45, y: 65, number: 4 },
    { id: 7, x: 45, y: 35, number: 8 },
    { id: 8, x: 65, y: 80, number: 7 },
    { id: 9, x: 65, y: 50, number: 10 },
    { id: 10, x: 65, y: 20, number: 11 },
    { id: 11, x: 80, y: 50, number: 9 },
]}