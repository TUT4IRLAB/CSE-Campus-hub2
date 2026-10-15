export type UserRole = "STUDENT" | "SECURITY_GUARD" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentNumber?: string;
  phone?: string | null;
}

export type Page =
  | "login"
  | "register"
  | "forgot-password"
  | "dashboard"
  | "study-connect"
  | "study-group-detail"
  | "create-study-group"
  | "my-study-groups"
  | "lost-found"
  | "report-lost"
  | "my-reports"
  | "marketplace"
  | "textbook-detail"
  | "sell-textbook"
  | "my-listings"
  | "events"
  | "event-detail"
  | "my-events"
  | "create-event"
  | "security-dashboard"
  | "security-items";

export interface StudyGroup {
  id: string;
  name: string;
  module: string;
  moduleCode: string;
  date: string;
  time: string;
  location: string;
  members: number;
  maxMembers: number;
  topics: string[];
  owner: string;
  ownerEmail?: string;
  joined?: boolean;
  isOwner?: boolean;
}

export interface LostItem {
  id: string;
  name: string;
  description: string;
  location: string;
  dateLost: string;
  status: "Lost" | "Found" | "Returned";
  reportedBy: string;
  category: string;
  image?: string;
}

export interface Textbook {
  id: string;
  title: string;
  author: string;
  module: string;
  moduleCode: string;
  price: number;
  condition: "Excellent" | "Good" | "Fair" | "Poor";
  seller: string;
  sellerEmail?: string;
  image: string;
  description: string;
  year: number;
  isbn?: string;
  available: boolean;
  mine?: boolean;
}

export interface CampusEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  organiser: string;
  registered: boolean;
  capacity: number;
  attendees: number;
  image: string;
  mine?: boolean;
}
