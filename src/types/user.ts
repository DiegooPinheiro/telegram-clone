export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  status: string;
  username?: string;
  phone?: string;
  bio?: string;
  birthday?: string;
  createdAt: string;
  lastSeen: string;
  online: boolean;
}
