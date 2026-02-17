export interface Account {
  _id: string;
  displayName: string;
  avatar: string | null;
  createdAt: string;
}

export interface UpdateProfileData {
  displayName: string;
  imageBuffer: string;
  challengeId: string;
  message: string;
  signature: string;
}

export interface VotePowerData {
  tokenBalance: number;
  votePower: number;
  tiers: Array<{
    title: string;
    minTokens: number;
    votePower: number;
  }>;
}
