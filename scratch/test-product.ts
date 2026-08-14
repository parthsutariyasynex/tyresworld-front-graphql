const query = `
  query ProductDetailByUrlKey($urlKey: String!) {
    products(filter: { url_key: { eq: $urlKey } }) {
      items {
        uid
        sku
        name
        country_of_manufacture
        brand: mgs_brand
        origin
        country
        warranty_period
      }
    }
  }
`;

async function main() {
  const urlKey = "roadstone-265-70-r18-116s-roadian-htx-rh5-2024";
  const res = await fetch("https://powertire.klever.ae/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { urlKey },
    }),
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

main().catch(console.error);
