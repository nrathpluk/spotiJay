export interface PlayerState {
  playlist: string[];
  names: string[];
  currentIndex: number;
}

export const playerState: PlayerState = {
  playlist: [],
  names: [],
  currentIndex: 0,
};
