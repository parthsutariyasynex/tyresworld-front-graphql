import { NextResponse } from "next/server";
import { magentoFetch } from "@/lib/graphql/client";
import { VIEW_MORE_FILTER_QUERY } from "@/lib/queries";
import { APP_CONFIG } from "@/src/config/app-config";

export interface TyreSizeItem {
  label: string;
  width: string;
  height: string;
  rim: string;
  rimKey: string;
  rimNumber: number;
}

// GraphQL query to fetch real product names and SKUs from Tyres category
const TYRES_PRODUCTS_QUERY = /* GraphQL */ `
  query GetTyresCatalogProducts($pageSize: Int!, $currentPage: Int!) {
    products(
      filter: { category_uid: { eq: "${APP_CONFIG.magento.tyresCategoryUid}" } }
      pageSize: $pageSize
      currentPage: $currentPage
    ) {
      total_count
      page_info {
        total_pages
        current_page
      }
      items {
        name
        sku
      }
    }
  }
`;

function parseSizeFromText(text: string): TyreSizeItem | null {
  // Matches sizes like "295/30 R20", "245/35 R20", "315/70 R17", "1000 R20", "1100 R22.5", "155 R12C", "35X12.5 R20", etc.
  const match =
    text.match(/\b(\d{3,4}\/\d{2,3}|\d{3,4}|\d{2}X\d{2}(?:\.\d)?)\s*R\s*(\d{2}(?:\.\d)?(?:C)?)\b/i) ||
    text.match(/\b(\d{3,4})\/(\d{2,3})\s*R\s*(\d{2}(?:\.\d)?)\b/i) ||
    text.match(/\b(\d{3,4})\s*R\s*(\d{2}(?:\.\d)?)\b/i);

  if (!match) return null;

  let sizeStr = match[0].replace(/\s+/g, " ").toUpperCase();
  if (!sizeStr.includes(" ")) {
    sizeStr = sizeStr.replace(/R/i, " R");
  }

  const rimMatch = sizeStr.match(/R\s*(\d+(\.\d+)?)/i);
  const rimNum = rimMatch ? parseFloat(rimMatch[1]) : 0;
  const rimKey = rimNum ? `R${rimNum}` : "R17";

  const parts = sizeStr.split(/\s*R\s*/i);
  const firstPart = parts[0] || "";
  const secondPart = parts[1] || "";
  let width = "";
  let height = "";

  if (firstPart.includes("/")) {
    const [w, h] = firstPart.split("/");
    width = w;
    height = h;
  } else {
    width = firstPart;
    height = "";
  }

  return {
    label: sizeStr,
    width,
    height,
    rim: secondPart,
    rimKey,
    rimNumber: rimNum,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") ?? "en";
  const store = locale === "ar" ? "ar" : "default";

  try {
    // 1. Fetch live rim options from viewMoreFilter
    const rimPromise = magentoFetch<{
      viewMoreFilter?: {
        aggregations?: Array<{
          attribute_code: string;
          options?: Array<{ label: string; value: string; count?: number }>;
        }>;
      };
    }>(
      VIEW_MORE_FILTER_QUERY,
      {
        filterName: "rim",
        search: "",
        filter: { category_uid: { eq: APP_CONFIG.magento.tyresCategoryUid } },
      },
      { store, revalidate: 300 }
    );

    // 2. Fetch batches of catalog products from Magento
    const page1Promise = magentoFetch<{
      products?: {
        total_count?: number;
        items?: Array<{ name: string; sku: string }>;
      };
    }>(TYRES_PRODUCTS_QUERY, { pageSize: 300, currentPage: 1 }, { store, revalidate: 300 });

    const page2Promise = magentoFetch<{
      products?: {
        items?: Array<{ name: string; sku: string }>;
      };
    }>(TYRES_PRODUCTS_QUERY, { pageSize: 300, currentPage: 2 }, { store, revalidate: 300 });

    const page3Promise = magentoFetch<{
      products?: {
        items?: Array<{ name: string; sku: string }>;
      };
    }>(TYRES_PRODUCTS_QUERY, { pageSize: 300, currentPage: 3 }, { store, revalidate: 300 });

    const [rimRes, p1, p2, p3] = await Promise.all([
      rimPromise,
      page1Promise,
      page2Promise,
      page3Promise,
    ]);

    const sizeMap = new Map<string, TyreSizeItem>();
    const allItems = [
      ...(p1.data?.products?.items ?? []),
      ...(p2.data?.products?.items ?? []),
      ...(p3.data?.products?.items ?? []),
    ];

    for (const item of allItems) {
      const parsed = parseSizeFromText(item.name) || parseSizeFromText(item.sku);
      if (parsed && !sizeMap.has(parsed.label)) {
        sizeMap.set(parsed.label, parsed);
      }
    }

    // Sort sizes logically: by rim size (12, 13, 14, ..., 24), then by label
    const sizes = Array.from(sizeMap.values()).sort((a, b) => {
      if (a.rimNumber !== b.rimNumber) return a.rimNumber - b.rimNumber;
      return a.label.localeCompare(b.label, undefined, { numeric: true });
    });

    // Extract dynamic rims from Magento's viewMoreFilter
    const rawRims = rimRes.data?.viewMoreFilter?.aggregations?.[0]?.options ?? [];
    const dynamicRims = Array.from(
      new Set(
        rawRims
          .map((r) => r.label.trim())
          .filter(Boolean)
          .map((r) => (r.startsWith("R") ? r : `R${r.replace(/C$/i, "")}`))
      )
    ).sort((a, b) => parseFloat(a.replace(/[^0-9.]/g, "")) - parseFloat(b.replace(/[^0-9.]/g, "")));

    const rims = ["ALL", ...(dynamicRims.length > 0 ? dynamicRims : ["R12", "R13", "R14", "R15", "R16", "R17", "R18", "R19", "R20", "R21", "R22", "R23", "R24"])];

    return NextResponse.json({
      sizes,
      rims,
      total: sizes.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, sizes: [], rims: [] }, { status: 500 });
  }
}
