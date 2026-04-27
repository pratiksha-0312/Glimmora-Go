import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "signup" | "sos" | "driver" | "referral";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  redirectUrl: string;
  read: boolean;
  createdAt: string; // ISO string — serialisable for persist
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

const SEED: AppNotification[] = [
  {
    id: "seed-1",
    type: "signup",
    title: "New Signup",
    message: "Priya Sharma just created an account.",
    redirectUrl: "/riders",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-2",
    type: "sos",
    title: "SOS Alert",
    message: "Rahul Verma triggered an SOS during ride #R-4821.",
    redirectUrl: "/sos",
    read: false,
    createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-3",
    type: "driver",
    title: "Driver Online",
    message: "Arjun Patel came online in Bengaluru.",
    redirectUrl: "/drivers",
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-4",
    type: "referral",
    title: "Referral Signup",
    message: "Meena Iyer signed up via referral code REF-8823.",
    redirectUrl: "/referrals",
    read: true,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-5",
    type: "signup",
    title: "New Signup",
    message: "Karthik Rajan registered from Chennai.",
    redirectUrl: "/riders",
    read: true,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
];

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: SEED,
      unreadCount: SEED.filter((n) => !n.read).length,

      addNotification: (n) => {
        const item: AppNotification = {
          ...n,
          id: makeId(),
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          notifications: [item, ...s.notifications].slice(0, 50),
          unreadCount: s.unreadCount + 1,
        }));
      },

      markAsRead: (id) =>
        set((s) => {
          const notifications = s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications,
            unreadCount: notifications.filter((n) => !n.read).length,
          };
        }),

      markAllAsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })),

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    { name: "glimmora-notifications" }
  )
);
