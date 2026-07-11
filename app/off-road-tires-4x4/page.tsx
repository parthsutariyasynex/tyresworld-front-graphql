import { redirect } from "next/navigation";

// Legacy non-locale URL → canonical locale route. The category itself is
// resolved dynamically by app/[locale]/[slug] via Magento urlResolver.
export default function OffRoadTiresRedirect() {
  redirect("/en/off-road-tires-4x4");
}
