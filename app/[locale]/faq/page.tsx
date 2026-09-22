import type { Metadata } from "next";
import FaqPage from "@/components/faq/FaqPage";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Frequently Asked Questions (FAQ) | TyresWorld UAE",
    description: "Find answers to frequently asked questions about tyre buying, size specifications, order tracking, mobile fitting, and payment methods at TyresWorld UAE.",
    alternates: {
      canonical: `/${params.locale}/faq`,
      languages: {
        en: "/en/faq",
      },
    },
  };
}

export default function Page() {
  return <FaqPage />;
}
