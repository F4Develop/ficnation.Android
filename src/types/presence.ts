export interface UserPresence {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  level?: number;
  levelTitle?: string;
  status: "online" | "away" | "offline";
  lastSeen: string;
}
