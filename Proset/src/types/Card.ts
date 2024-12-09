export interface Card {
    id: number; // Unique ID for the card
    slots: boolean[]; // Array of 6 slots, each true (dot) or false (empty)
  }