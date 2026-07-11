import { redirect } from "next/navigation";

// Legacy non-locale URL → canonical locale route. The category itself is
// resolved dynamically by app/[locale]/[slug] via Magento urlResolver.
export default function OnRoadTiresRedirect() {
  redirect("/en/on-road-tires");
}
