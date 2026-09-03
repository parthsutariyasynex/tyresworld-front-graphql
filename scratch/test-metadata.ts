import dns from "dns";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const query = `
  query AttributeMetadata {
    customAttributeMetadataV2(
      attributes: [
        { entity_type: "catalog_product", attribute_code: "country" }
        { entity_type: "catalog_product", attribute_code: "warranty_period" }
        { entity_type: "catalog_product", attribute_code: "oem" }
        { entity_type: "catalog_product", attribute_code: "oem_marking" }
        { entity_type: "catalog_product", attribute_code: "origin" }
      ]
    ) {
      items {
        code
        ... on CatalogAttributeMetadata {
          options {
            label
            value
          }
        }
      }
      errors {
        type
        message
      }
    }
  }
`;

async function main() {
  const res = await fetch("https://www1.tyresworld.ae/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}

main().catch(console.error);
