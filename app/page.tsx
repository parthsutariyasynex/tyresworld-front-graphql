import LocaleHomePage from "./[locale]/page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return <LocaleHomePage params={{ locale: "en" }} />;
}
