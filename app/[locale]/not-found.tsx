import type { Metadata } from "next";
import NotFoundContent from "@/components/NotFoundContent";

export const metadata: Metadata = {
  title: "404 - Page Not Found | TyresWorld",
  description: "The page or product you are looking for could not be found.",
};

export default function NotFound() {
  return <NotFoundContent />;
}
