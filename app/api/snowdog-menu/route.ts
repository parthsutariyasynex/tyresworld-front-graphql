import { NextRequest, NextResponse } from "next/server";
import { SNOWDOG_MENUS_QUERY, SNOWDOG_MENU_NODES_QUERY } from "@/lib/queries";
import { APP_CONFIG, magentoHeaders } from "@/src/config/app-config";

export const dynamic = "force-dynamic";

export type SnowdogMenuMeta = {
  menu_id:    number;
  identifier: string;
  title:      string;
  css_class:  string | null;
};

export type SnowdogMenuNode = {
  node_id:   number;
  parent_id: number | null;
  type:      string;
  title:     string | null;
  url_key:   string | null;
  level:     number;
  position:  number;
  classes:   string | null;
};

type GqlResult = { data?: Record<string, unknown>; errors?: { message: string }[] };

async function gql(query: string, variables: Record<string, unknown> = {}): Promise<GqlResult> {
  const res = await fetch(APP_CONFIG.magento.graphqlUrl, {
    method:  "POST",
    headers: magentoHeaders() as Record<string, string>,
    body:    JSON.stringify({ query, variables }),
    cache:   "no-store",
  });
  return (await res.json().catch(() => ({}))) as GqlResult;
}

/* GET /api/snowdog-menu
 * GET /api/snowdog-menu?identifier=desktop-menu   — fetch nodes for a specific menu */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get("identifier");

  try {
    if (identifier) {
      // Fetch nodes for a specific menu identifier
      const j = await gql(SNOWDOG_MENU_NODES_QUERY, { identifier });

      if (j.errors?.length) {
        return NextResponse.json({ nodes: [], error: j.errors[0].message });
      }

      const nodes = ((j.data?.snowdogMenuNodes as { items?: SnowdogMenuNode[] } | undefined)?.items ?? [])
        .sort((a, b) => a.position - b.position);

      return NextResponse.json({ nodes });
    }

    // No identifier — return list of all menus
    const j = await gql(SNOWDOG_MENUS_QUERY);

    if (j.errors?.length) {
      return NextResponse.json({ menus: [], error: j.errors[0].message });
    }

    const menus = ((j.data?.snowdogMenus as { items?: SnowdogMenuMeta[] } | undefined)?.items ?? []);

    return NextResponse.json({ menus });
  } catch (e) {
    return NextResponse.json(
      { menus: [], nodes: [], error: e instanceof Error ? e.message : "Network error" },
      { status: 502 },
    );
  }
}
