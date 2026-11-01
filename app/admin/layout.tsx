import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  description: "Contractor list, stats, and new accounts.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
