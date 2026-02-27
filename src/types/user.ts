export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  status: string;
  createdAt: string;
  lastSeen: string;
  online: boolean;
}
