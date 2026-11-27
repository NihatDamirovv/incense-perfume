import { mkdir, writeFile } from "node:fs/promises";
import { defaultSettings } from "../app/site-content.ts";
const product = {
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "brand",
    "price",
    "size",
    "gender",
    "family",
    "notes",
    "description",
    "image",
    "available",
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string", minLength: 1, maxLength: 150 },
    brand: { type: "string", minLength: 1, maxLength: 150 },
    price: { type: "number", minimum: 0, maximum: 1000000 },
    size: { type: "integer", minimum: 1, maximum: 10000 },
    gender: { type: "string", enum: ["Kişi", "Qadın", "Uniseks"] },
    family: { type: "string", maxLength: 100 },
    notes: { type: "string", maxLength: 500 },
    description: { type: "string", maxLength: 5000 },
    image: {
      type: "string",
      description: "Empty or URL returned by /api/upload",
    },
    available: { type: "boolean" },
    origin: { type: "string", enum: ["", "Avropa", "Ərəb"] },
    seasons: {
      type: "array",
      uniqueItems: true,
      maxItems: 4,
      items: { type: "string", enum: ["Yaz", "Yay", "Payız", "Qış"] },
    },
    variants: {
      type: "array",
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["size", "price", "available"],
        properties: {
          size: { type: "integer", minimum: 1, maximum: 10000 },
          price: { type: "number", minimum: 0, maximum: 1000000 },
          available: { type: "boolean" },
        },
      },
    },
  },
};
const ref = { $ref: "#/components/schemas/Product" };
const response = (description, schema) => ({
  description,
  ...(schema ? { content: { "application/json": { schema } } } : {}),
});
const errors = {
  400: response("Invalid input"),
  401: response("Admin token required"),
  403: response("Origin rejected"),
  404: response("Not found"),
  413: response("Request too large"),
  415: response("Unsupported content type"),
  429: response("Rate limit exceeded"),
  500: response("Internal error"),
  503: response("Service not configured"),
};
const secured = { security: [{ AdminToken: [] }] };
const body = {
  required: true,
  content: { "application/json": { schema: ref } },
};
const paths = {
  "/api/products": {
    get: {
      summary: "Filter and paginate products",
      parameters: [
        "q",
        "brand",
        "gender",
        "origin",
        "season",
        "available",
        "minPrice",
        "maxPrice",
        "sort",
        "page",
        "limit",
      ].map((name) => ({
        name,
        in: "query",
        schema: {
          type: ["page", "limit", "minPrice", "maxPrice"].includes(name)
            ? "number"
            : "string",
        },
        description:
          name === "sort"
            ? "default, price_asc, price_desc, name"
            : name === "limit"
              ? "1–100; default 12"
              : name === "page"
                ? "Starts at 1"
                : "",
      })),
      responses: {
        200: response("Products", {
          type: "object",
          properties: {
            data: { type: "array", items: ref },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                pages: { type: "integer" },
              },
            },
          },
        }),
        ...errors,
      },
    },
    post: {
      summary: "Create product",
      ...secured,
      requestBody: body,
      responses: {
        201: response("Created", { type: "object", properties: { data: ref } }),
        ...errors,
      },
    },
  },
  "/api/products/{id}": {
    parameters: [
      { name: "id", in: "path", required: true, schema: { type: "string" } },
    ],
    get: {
      summary: "Get product",
      responses: {
        200: response("Product", { type: "object", properties: { data: ref } }),
        ...errors,
      },
    },
    put: {
      summary: "Replace product",
      ...secured,
      requestBody: body,
      responses: {
        200: response("Updated", { type: "object", properties: { data: ref } }),
        ...errors,
      },
    },
    delete: {
      summary: "Delete product",
      ...secured,
      responses: { 204: response("Deleted"), ...errors },
    },
  },
  "/api/brands": {
    get: {
      summary: "Brands and product counts",
      responses: {
        200: response("Brand list", {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  count: { type: "integer" },
                },
              },
            },
          },
        }),
        ...errors,
      },
    },
  },
  "/api/upload": {
    post: {
      summary: "Upload JPG, PNG or WebP (max 5 MB)",
      ...secured,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["file"],
              properties: { file: { type: "string", format: "binary" } },
            },
          },
        },
      },
      responses: {
        201: response("Image URL", {
          type: "object",
          properties: { url: { type: "string" } },
        }),
        ...errors,
      },
    },
  },
  "/api/images/{key}": {
    get: {
      summary: "Read uploaded image",
      parameters: [
        { name: "key", in: "path", required: true, schema: { type: "string" } },
      ],
      responses: {
        200: {
          description: "Image bytes",
          content: {
            "image/png": { schema: { type: "string", format: "binary" } },
            "image/jpeg": { schema: { type: "string", format: "binary" } },
            "image/webp": { schema: { type: "string", format: "binary" } },
          },
        },
        404: response("Image not found"),
      },
    },
  },
  "/api/auth/check": {
    post: {
      summary: "Verify admin token",
      ...secured,
      responses: { 200: response("Authenticated"), ...errors },
    },
  },
  "/api/admin/audit": {
    get: {
      summary: "Latest 100 audit records",
      ...secured,
      responses: { 200: response("Audit entries"), ...errors },
    },
  },
  "/api/health": {
    get: {
      summary: "Database availability and R2 binding configuration",
      responses: { 200: response("Healthy"), 503: response("Unavailable") },
    },
  },
  "/api/catalog": {
    get: {
      summary: "UI compatibility: complete catalog",
      responses: {
        200: response("Products", { type: "array", items: ref }),
        ...errors,
      },
    },
    post: {
      summary: "UI compatibility: create or update based on id",
      ...secured,
      requestBody: body,
      responses: { 200: response("Saved"), ...errors },
    },
    delete: {
      summary: "UI compatibility: delete by id in body",
      ...secured,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["id"],
              properties: { id: { type: "string" } },
            },
          },
        },
      },
      responses: { 200: response("Deleted"), ...errors },
    },
  },
};
const brandSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "description", "image", "featured", "sortOrder"],
  properties: {
    name: { type: "string", minLength: 1, maxLength: 150 },
    description: { type: "string", maxLength: 2000 },
    image: { type: "string" },
    featured: { type: "boolean" },
    sortOrder: { type: "integer", minimum: 0, maximum: 9999 },
  },
};
const settingsSchema = {
  type: "object",
  additionalProperties: false,
  required: Object.keys(defaultSettings),
  properties: Object.fromEntries(
    Object.entries(defaultSettings).map(([k, v]) => [
      k,
      { type: typeof v, default: v },
    ]),
  ),
};
paths["/api/brands"].post = {
  summary: "Create an independent brand",
  ...secured,
  requestBody: {
    required: true,
    content: { "application/json": { schema: brandSchema } },
  },
  responses: {
    201: response("Created brand"),
    409: response("Duplicate name"),
    ...errors,
  },
};
paths["/api/brands/{id}"] = {
  parameters: [
    { name: "id", in: "path", required: true, schema: { type: "string" } },
  ],
  put: {
    summary: "Update brand and rename linked products",
    ...secured,
    requestBody: {
      required: true,
      content: { "application/json": { schema: brandSchema } },
    },
    responses: {
      200: response("Updated brand"),
      409: response("Duplicate brand name"),
      ...errors,
    },
  },
  delete: {
    summary: "Delete empty brand",
    ...secured,
    responses: {
      204: response("Deleted"),
      409: response("Brand still has products"),
      ...errors,
    },
  },
};
paths["/api/settings"] = {
  get: {
    summary: "Get public site settings and revision",
    responses: { 200: response("Site settings"), ...errors },
  },
  put: {
    summary: "Update site settings with optimistic concurrency",
    ...secured,
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["data", "revision"],
            properties: {
              data: settingsSchema,
              revision: { type: "integer", minimum: 0 },
            },
          },
        },
      },
    },
    responses: {
      200: response("Saved settings and new revision"),
      409: response("Revision conflict; reload current settings"),
      ...errors,
    },
  },
};
paths["/api/checkout"] = {
  post: {
    summary:
      "Prepare WhatsApp order draft using current prices and configured phone number",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["items"],
            properties: {
              items: {
                type: "array",
                minItems: 1,
                maxItems: 30,
                items: {
                  type: "object",
                  required: ["id", "quantity"],
                  properties: {
                    id: { type: "string" },
                    quantity: { type: "integer", minimum: 1, maximum: 99 },
                    size: {
                      type: "integer",
                      minimum: 1,
                      maximum: 10000,
                      description: "Selected ml; omitted uses base size",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    responses: {
      200: response("WhatsApp compose URL and total", {
        type: "object",
        properties: { url: { type: "string" }, total: { type: "number" } },
      }),
      409: response("Product missing or out of stock"),
      ...errors,
    },
  },
};
const spec = {
  openapi: "3.0.3",
  info: {
    title: "Incense Parfume API",
    version: "1.1.0",
    description:
      "Private Site access is separate from API admin authorization. Admin writes use a server-configured bearer token.",
  },
  servers: [
    { url: "http://127.0.0.1:5173", description: "Local development" },
    {
      url: "https://noir-parfum-nd.tawnyisle64.chatgpt.site",
      description: "Private hosted Site",
    },
  ],
  paths,
  components: {
    schemas: {
      Product: product,
      Brand: brandSchema,
      SiteSettings: settingsSchema,
    },
    securitySchemes: {
      AdminToken: {
        type: "http",
        scheme: "bearer",
        description: "ADMIN_PASSWORD server secret",
      },
    },
  },
};
const example = {
  name: "Yeni parfüm",
  brand: "Creed",
  price: 250,
  size: 100,
  gender: "Uniseks",
  family: "Odunsu",
  notes: "Berqamot · Müşk",
  description: "Parfüm haqqında məlumat",
  image: "",
  available: true,
};
const items = [];
for (const [path, methods] of Object.entries(paths))
  for (const [method, op] of Object.entries(methods)) {
    if (method === "parameters") continue;
    const request = {
      method: method.toUpperCase(),
      header: [],
      url:
        "{{baseUrl}}" +
        path
          .replace(
            "{id}",
            path.includes("/brands") ? "{{brandId}}" : "{{productId}}",
          )
          .replace("{key}", "{{imageKey}}"),
    };
    if (op.security)
      request.auth = {
        type: "bearer",
        bearer: [{ key: "token", value: "{{adminToken}}", type: "string" }],
      };
    if (op.requestBody?.content?.["application/json"]) {
      request.header.push({ key: "Content-Type", value: "application/json" });
      request.body = {
        mode: "raw",
        raw: JSON.stringify(
          path === "/api/settings"
            ? { data: defaultSettings, revision: 0 }
            : path === "/api/checkout"
              ? { items: [{ id: "{{productId}}", quantity: 1 }] }
              : path.includes("/brands")
                ? {
                    name: "Yeni brend",
                    description: "",
                    image: "",
                    featured: true,
                    sortOrder: 0,
                  }
                : method === "delete"
                  ? { id: "{{productId}}" }
                  : example,
          null,
          2,
        ),
        options: { raw: { language: "json" } },
      };
    }
    if (path === "/api/upload")
      request.body = {
        mode: "formdata",
        formdata: [{ key: "file", type: "file", src: [] }],
      };
    items.push({ name: op.summary, request });
  }
await mkdir("docs", { recursive: true });
await writeFile("docs/openapi.json", JSON.stringify(spec, null, 2) + "\n");
await writeFile(
  "docs/NOIR.postman_collection.json",
  JSON.stringify(
    {
      info: {
        name: "Incense Parfume API",
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
      variable: [
        { key: "baseUrl", value: "http://127.0.0.1:5173" },
        { key: "adminToken", value: "" },
        { key: "productId", value: "demo-1" },
        { key: "imageKey", value: "" },
        { key: "brandId", value: "" },
      ],
      item: items,
    },
    null,
    2,
  ) + "\n",
);
console.log("OpenAPI and Postman collection generated.");
