/* ─────────────────────────────────────────────────────────────────
   WHEEL API — GraphQL query strings
   Endpoint: https://wheel-api.klever.ae/graphql.php
   Schema verified via introspection on 2026-07-06.

   Key facts:
   - make / model identifiers are SLUGS (e.g. "toyota"), not numeric IDs
   - year is an Int, not a String
   - The API is a vehicle fitment database, not a wheel product catalog
   - `modifications` returns engine/trim variants for a specific vehicle year
   - `search` returns vehicles whose stock tyre fitment matches a given size
───────────────────────────────────────────────────────────────── */

/**
 * All vehicle manufacturers.
 * Optional: region, ordering ("asc"|"desc"), limit, offset for pagination.
 */
export const WHEEL_MAKES_QUERY = /* GraphQL */ `
  query WheelMakes($limit: Int, $offset: Int, $ordering: String, $region: String) {
    makes(limit: $limit, offset: $offset, ordering: $ordering, region: $region) {
      count
      data {
        slug
        name
        logo
      }
    }
  }
`;

/**
 * Models for a given make slug.
 * `make` is a slug string (e.g. "toyota"), not a numeric ID.
 */
export const WHEEL_MODELS_QUERY = /* GraphQL */ `
  query WheelModels($make: String!, $limit: Int, $offset: Int, $ordering: String) {
    models(make: $make, limit: $limit, offset: $offset, ordering: $ordering) {
      count
      data {
        slug
        name
      }
    }
  }
`;

/**
 * Production years for a given make + model.
 * Both `make` and `model` are slug strings.
 * Year.slug and Year.name are both Int (the year number itself).
 */
export const WHEEL_YEARS_QUERY = /* GraphQL */ `
  query WheelYears($make: String!, $model: String!) {
    years(make: $make, model: $model) {
      count
      data {
        slug
        name
      }
    }
  }
`;

/**
 * Engine / trim modifications for a specific make + model + year.
 * `year` is Int (e.g. 2022), not a string.
 * Returns all trim variants with engine specs (fuel, capacity, horsepower).
 */
export const WHEEL_MODIFICATIONS_QUERY = /* GraphQL */ `
  query WheelModifications($make: String!, $model: String!, $year: Int!) {
    modifications(make: $make, model: $model, year: $year) {
      count
      data {
        slug
        name
        trim
        engine {
          fuel
          capacity
          power {
            hp
          }
        }
      }
    }
  }
`;

/**
 * Reverse lookup: find vehicles whose stock tyre fitment includes this size.
 * All three dimensions are required Int values.
 * Returns front/rear tyre sizes per vehicle + isStock flag.
 */
export const WHEEL_SEARCH_QUERY = /* GraphQL */ `
  query WheelSearch($width: Int!, $height: Int!, $rim: Int!) {
    search(width: $width, height: $height, rim: $rim) {
      count
      data {
        makeName
        modelName
        makeSlug
        modelSlug
        yearRanges
        frontWidth
        frontHeight
        frontRim
        rearWidth
        rearHeight
        rearRim
        isStock
      }
    }
  }
`;
