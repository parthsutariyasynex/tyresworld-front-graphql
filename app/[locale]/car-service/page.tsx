import type { Metadata } from "next";
import CarServicesPage from "@/components/service/CarServicesPage";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return {
    title: "Expert Car Repairs & Services in Abu Dhabi | TyresWorld",
    description: "Professional car repair & maintenance services in Abu Dhabi by Carolyn Auto Care – L.L.C – S.P.C, service hub of TyresWorld. Tyre service, battery, AC, brakes, oil change, alignment & rim repair.",
    alternates: {
      canonical: `/${params.locale}/car-service`,
      languages: {
        en: "/en/car-service",
      },
    },
  };
}

export default function Page() {
  return <CarServicesPage />;
}
