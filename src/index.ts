import * as dto from "./dto";
import * as schema from "@db/schema";
import { Hono } from "hono";
import { db } from "@db/client";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { httpResponse } from "@utils/http-response";
import { myValidator } from "@middlewares/my-validator";
import { responseMessage } from "@utils/response-message";
import { errorHandler } from "@middlewares/error-handler";
import { parseOtoReportProduct } from "./parser/oto-report";
import { parseJsonOkeProduct } from "./parser/json-oke";
import { parseFilterCondition } from "@utils/filter-condition";
import { cors } from "hono/cors";
import { validateEnv } from "@utils/validator";
import { envConfig } from "@configs/env";
import { verifyPassword } from "@utils/security";
import { UnauthorizedError } from "@utils/main-error";
import { sign } from "hono/jwt";
import { deleteCookie, setCookie } from "hono/cookie";
import { auth } from "@middlewares/auth";

validateEnv();

const app = new Hono();

app.onError(errorHandler);
app.use(
  cors({
    origin: envConfig.feUrl,
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

const COOKIE_NAME = "access_token";
const TOKEN_EXPIRES_IN = 60 * 60 * 12; // 12 jam

// LOGIN
app.post("/auth/login", myValidator(dto.loginUserBodySchema, "json"), async (c) => {
  const body = c.get("json");
  const isUsernameValid = body.username === envConfig.authUsername;
  const isPasswordValid = await verifyPassword(body.password, envConfig.authPasswordHash);

  if (!isUsernameValid || !isPasswordValid) {
    throw new UnauthorizedError(responseMessage.invalidCredentials);
  }

  const now = Math.floor(Date.now() / 1000);
  const token = await sign(
    {
      sub: envConfig.authUsername,
      iat: now,
      exp: now + TOKEN_EXPIRES_IN,
    },
    envConfig.jwtSecret,
    "HS256",
  );

  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure: envConfig.nodeEnv === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: TOKEN_EXPIRES_IN,
  });

  return c.json(
    httpResponse.success({ username: envConfig.authUsername }, responseMessage.success),
    200,
  );
});

// AUTH
app.use(auth());

// ME
app.get("/me", (c) => {
  return c.json(
    httpResponse.success({ username: envConfig.authUsername }, responseMessage.success),
    200,
  );
});

// LOGOUT
app.post("/auth/logout", (c) => {
  deleteCookie(c, COOKIE_NAME, {
    path: "/",
  });

  return c.json(
    httpResponse.success({ username: envConfig.authUsername }, responseMessage.success),
    200,
  );
});

// TARGET TYPE
app.post("/target-types/create", myValidator(dto.createTargetTypeBodySchema, "json"), async (c) => {
  const body = c.get("json");
  const [result] = await db.insert(schema.targetTypes).values(body).returning({
    code: schema.targetTypes.code,
  });

  return c.json(httpResponse.success(result ?? null, responseMessage.created), 201);
});

app.get("/target-types/find", myValidator(dto.findTargetTypeQuerySchema, "query"), async (c) => {
  const query = c.get("query");
  const conditions: (SQL | undefined)[] = [];

  if (query.code !== undefined) {
    conditions.push(parseFilterCondition(schema.targetTypes.code, query.code));
  }

  if (query.name !== undefined) {
    conditions.push(parseFilterCondition(schema.targetTypes.name, query.name));
  }

  const finalCondition =
    conditions.length === 1
      ? conditions[0]
      : conditions.length > 1
        ? and(...conditions)
        : undefined;

  const result = await db
    .select()
    .from(schema.targetTypes)
    .where(finalCondition)
    .orderBy(asc(schema.targetTypes.code))
    .limit(500);

  return c.json(httpResponse.success(result, responseMessage.success), 200);
});

// PROVIDER
app.post("/providers/create", myValidator(dto.createProviderBodySchema, "json"), async (c) => {
  const body = c.get("json");
  const [result] = await db.insert(schema.providers).values(body).returning({
    code: schema.providers.code,
  });

  return c.json(httpResponse.success(result ?? null, responseMessage.created), 201);
});

app.get("/providers/find", myValidator(dto.findProviderQuerySchema, "query"), async (c) => {
  const query = c.get("query");
  const conditions: (SQL | undefined)[] = [];

  if (query.code !== undefined) {
    conditions.push(parseFilterCondition(schema.providers.code, query.code));
  }

  if (query.name !== undefined) {
    conditions.push(parseFilterCondition(schema.providers.name, query.name));
  }

  const finalCondition =
    conditions.length === 1
      ? conditions[0]
      : conditions.length > 1
        ? and(...conditions)
        : undefined;

  const result = await db
    .select()
    .from(schema.providers)
    .where(finalCondition)
    .orderBy(asc(schema.providers.code))
    .limit(500);

  return c.json(httpResponse.success(result, responseMessage.success), 200);
});

app.post(
  "/providers/update/:code",
  myValidator(dto.updateProviderBodySchema, "json"),
  async (c) => {
    const param = c.req.param();
    const body = c.get("json");
    const [result] = await db
      .update(schema.providers)
      .set(body)
      .where(eq(schema.providers.code, param.code))
      .returning({
        code: schema.providers.code,
      });

    return c.json(httpResponse.success(result ?? null, responseMessage.updated), 200);
  },
);

app.post("/providers/delete/:code", async (c) => {
  const param = c.req.param();
  const [result] = await db
    .delete(schema.providers)
    .where(eq(schema.providers.code, param.code))
    .returning({
      code: schema.providers.code,
    });

  return c.json(httpResponse.success(result ?? null, responseMessage.deleted), 200);
});

// PRODUCT
app.post("/products/create", myValidator(dto.createProductBodySchema, "json"), async (c) => {
  const body = c.get("json");
  const [result] = await db.insert(schema.products).values(body).returning({
    code: schema.products.code,
  });

  return c.json(httpResponse.success(result ?? null, responseMessage.created), 201);
});

app.post("/products/create-otomax", myValidator(dto.createProductBodySchema, "json"), async (c) => {
  const body = c.get("json");
  const [result] = await db.insert(schema.products).values(body).returning({
    code: schema.products.code,
  });

  return c.json(httpResponse.success(result ?? null, responseMessage.created), 201);
});

app.get("/products/find", myValidator(dto.findProductQuerySchema, "query"), async (c) => {
  const query = c.get("query");
  const conditions: (SQL | undefined)[] = [];

  if (query.code !== undefined) {
    conditions.push(parseFilterCondition(schema.products.code, query.code));
  }

  if (query.name !== undefined) {
    conditions.push(parseFilterCondition(schema.products.name, query.name));
  }

  if (query.providerCode !== undefined) {
    conditions.push(eq(schema.products.providerCode, query.providerCode));
  }

  const finalCondition =
    conditions.length === 1
      ? conditions[0]
      : conditions.length > 1
        ? and(...conditions)
        : undefined;

  const rankedSuppliers = db
    .select({
      productCode: schema.productSuppliers.productCode,
      supplierCode: schema.productSuppliers.supplierCode,
      supplierProductCode: schema.productSuppliers.supplierProductCode,
      rn: sql<number>`
      ROW_NUMBER() OVER (
        PARTITION BY ${schema.productSuppliers.productCode}
        ORDER BY
          ${schema.productSuppliers.price} ASC,
          ${schema.productSuppliers.supplierCode} ASC,
          ${schema.productSuppliers.supplierProductCode} ASC
      )
    `.as("rn"),
    })
    .from(schema.productSuppliers)
    .where(eq(schema.productSuppliers.status, "active"))
    .as("ranked_suppliers");

  const supplierPriceRange = db
    .select({
      productCode: schema.productSuppliers.productCode,
      lowestPrice: sql<number>`MIN(${schema.productSuppliers.price})`.as("lowest_price"),
      highestPrice: sql<number>`MAX(${schema.productSuppliers.price})`.as("highest_price"),
    })
    .from(schema.productSuppliers)
    .where(eq(schema.productSuppliers.status, "active"))
    .groupBy(schema.productSuppliers.productCode)
    .as("supplier_price_range");

  const result = await db
    .select({
      code: schema.products.code,
      providerCode: schema.products.providerCode,
      name: schema.products.name,
      createdAt: schema.products.createdAt,
      updatedAt: schema.products.updatedAt,
      lowestPrice: supplierPriceRange.lowestPrice,
      highestPrice: supplierPriceRange.highestPrice,
    })
    .from(schema.products)
    .leftJoin(
      rankedSuppliers,
      and(eq(rankedSuppliers.productCode, schema.products.code), eq(rankedSuppliers.rn, 1)),
    )
    .leftJoin(
      schema.productSuppliers,
      and(
        eq(schema.productSuppliers.productCode, rankedSuppliers.productCode),
        eq(schema.productSuppliers.supplierCode, rankedSuppliers.supplierCode),
        eq(schema.productSuppliers.supplierProductCode, rankedSuppliers.supplierProductCode),
      ),
    )
    .leftJoin(supplierPriceRange, eq(supplierPriceRange.productCode, schema.products.code))
    .where(finalCondition)
    .orderBy(asc(supplierPriceRange.lowestPrice))
    .limit(500);

  return c.json(httpResponse.success(result, responseMessage.success), 200);
});

app.post("/products/update/:code", myValidator(dto.updateProductBodySchema, "json"), async (c) => {
  const param = c.req.param();
  const body = c.get("json");
  const [result] = await db
    .update(schema.products)
    .set(body)
    .where(eq(schema.products.code, param.code))
    .returning({
      code: schema.products.code,
    });

  return c.json(httpResponse.success(result ?? null, responseMessage.updated), 200);
});

app.post("/products/delete/:code", async (c) => {
  const param = c.req.param();
  const [result] = await db
    .delete(schema.products)
    .where(eq(schema.products.code, param.code))
    .returning({
      code: schema.products.code,
    });

  return c.json(httpResponse.success(result ?? null, responseMessage.deleted), 200);
});

// SUPPLIER
app.post("/suppliers/create", myValidator(dto.createSupplierBodySchema, "json"), async (c) => {
  const body = c.get("json");
  const [result] = await db.insert(schema.suppliers).values(body).returning({
    code: schema.suppliers.code,
  });

  return c.json(httpResponse.success(result ?? null, responseMessage.created), 201);
});

app.get("/suppliers/find", myValidator(dto.findSupplierQuerySchema, "query"), async (c) => {
  const query = c.get("query");
  const conditions: (SQL | undefined)[] = [];

  if (query.code !== undefined) {
    conditions.push(parseFilterCondition(schema.suppliers.code, query.code));
  }

  if (query.name !== undefined) {
    conditions.push(parseFilterCondition(schema.suppliers.name, query.name));
  }

  if (query.targetTypeCode !== undefined) {
    conditions.push(eq(schema.suppliers.targetTypeCode, query.targetTypeCode));
  }

  const finalCondition =
    conditions.length === 1
      ? conditions[0]
      : conditions.length > 1
        ? and(...conditions)
        : undefined;

  const result = await db
    .select()
    .from(schema.suppliers)
    .where(finalCondition)
    .orderBy(asc(schema.suppliers.code))
    .limit(500);

  return c.json(httpResponse.success(result, responseMessage.success), 200);
});

app.post(
  "/suppliers/update/:code",
  myValidator(dto.updateSupplierBodySchema, "json"),
  async (c) => {
    const param = c.req.param();
    const body = c.get("json");
    const [result] = await db
      .update(schema.suppliers)
      .set(body)
      .where(eq(schema.suppliers.code, param.code))
      .returning({
        code: schema.suppliers.code,
      });

    return c.json(httpResponse.success(result ?? null, responseMessage.updated), 200);
  },
);

app.post("/suppliers/delete/:code", async (c) => {
  const param = c.req.param();
  const [result] = await db
    .delete(schema.suppliers)
    .where(eq(schema.suppliers.code, param.code))
    .returning({
      code: schema.suppliers.code,
    });

  return c.json(httpResponse.success(result ?? null, responseMessage.deleted), 200);
});

// PRODUCT SUPPLIERS
app.post(
  "/product-suppliers/create",
  myValidator(dto.createProductSupplierBodySchema, "json"),
  async (c) => {
    const body = c.get("json");
    const [result] = await db.insert(schema.productSuppliers).values(body).returning({
      productCode: schema.productSuppliers.productCode,
      supplierCode: schema.productSuppliers.supplierCode,
      supplierProductCode: schema.productSuppliers.supplierProductCode,
    });

    return c.json(httpResponse.success(result ?? null, responseMessage.created), 201);
  },
);

app.post(
  "/product-suppliers/create-otomax",
  myValidator(dto.createProductSupplierBodySchema, "json"),
  async (c) => {
    const getProductCode = (input: string) =>
      input.match(/(?:^|&)(?:kodeproduk|product)=([^&]*)/i)?.[1] || input;

    const body = c.get("json");
    const [result] = await db
      .insert(schema.productSuppliers)
      .values({
        ...body,
        supplierProductCode: getProductCode(body.supplierProductCode),
      })
      .returning({
        productCode: schema.productSuppliers.productCode,
        supplierCode: schema.productSuppliers.supplierCode,
        supplierProductCode: schema.productSuppliers.supplierProductCode,
      });

    return c.json(httpResponse.success(result, responseMessage.created), 201);
  },
);

app.get(
  "/product-suppliers/find",
  myValidator(dto.findProductSupplierQuerySchema, "query"),
  async (c) => {
    const query = c.get("query");
    const conditions: (SQL | undefined)[] = [];

    if (query.productCode !== undefined) {
      conditions.push(parseFilterCondition(schema.productSuppliers.productCode, query.productCode));
    }

    if (query.supplierCode !== undefined) {
      conditions.push(eq(schema.productSuppliers.supplierCode, query.supplierCode));
    }

    if (query.supplierProductCode !== undefined) {
      conditions.push(
        parseFilterCondition(
          schema.productSuppliers.supplierProductCode,
          query.supplierProductCode,
        ),
      );
    }

    const finalCondition =
      conditions.length === 1
        ? conditions[0]
        : conditions.length > 1
          ? and(...conditions)
          : undefined;

    const result = await db
      .select()
      .from(schema.productSuppliers)
      .where(finalCondition)
      .orderBy(asc(schema.productSuppliers.productCode))
      .limit(500);

    return c.json(httpResponse.success(result, responseMessage.success), 200);
  },
);

app.get("/product-suppliers/find/:productCode", async (c) => {
  const param = c.req.param();
  const result = await db
    .select()
    .from(schema.productSuppliers)
    .where(eq(schema.productSuppliers.productCode, param.productCode))
    .orderBy(asc(schema.productSuppliers.price))
    .limit(500);

  return c.json(httpResponse.success(result, responseMessage.success), 200);
});

app.post(
  "/product-suppliers/update/:productCode/:supplierCode/:supplierProductCode",
  myValidator(dto.updateProductSupplierBodySchema, "json"),
  async (c) => {
    const param = c.req.param();
    const body = c.get("json");
    const [result] = await db
      .update(schema.productSuppliers)
      .set(body)
      .where(
        and(
          eq(schema.productSuppliers.productCode, param.productCode),
          eq(schema.productSuppliers.supplierCode, param.supplierCode),
          eq(schema.productSuppliers.supplierProductCode, param.supplierProductCode),
        ),
      )
      .returning({
        productCode: schema.productSuppliers.productCode,
        supplierCode: schema.productSuppliers.supplierCode,
        supplierProductCode: schema.productSuppliers.supplierProductCode,
      });

    return c.json(httpResponse.success(result ?? null, responseMessage.updated), 200);
  },
);

app.post("/product-suppliers/delete/:productCode/:supplierCode/:supplierProductCode", async (c) => {
  const param = c.req.param();
  const [result] = await db
    .delete(schema.productSuppliers)
    .where(
      and(
        eq(schema.productSuppliers.productCode, param.productCode),
        eq(schema.productSuppliers.supplierCode, param.supplierCode),
        eq(schema.productSuppliers.supplierProductCode, param.supplierProductCode),
      ),
    )
    .returning({
      productCode: schema.productSuppliers.productCode,
      supplierCode: schema.productSuppliers.supplierCode,
      supplierProductCode: schema.productSuppliers.supplierProductCode,
    });

  return c.json(httpResponse.success(result ?? null, responseMessage.deleted), 200);
});

// APP
app.post("/sync", async (c) => {
  const suppliers = await db.select().from(schema.suppliers).limit(500);
  const data: { supplierCode: string; productMap: Map<string, ProductData> }[] = [];

  await Promise.all(
    suppliers.map(async (supplier) => {
      async function execute(productList: ProductData[]) {
        const productMap = new Map(productList.map((item) => [item.code, item]));

        data.push({
          supplierCode: supplier.code,
          productMap,
        });

        await db
          .update(schema.suppliers)
          .set({ lastSyncedAt: new Date() })
          .where(eq(schema.suppliers.code, supplier.code));
      }

      if (supplier.targetTypeCode === "OTOREPORT") {
        const productList = await parseOtoReportProduct(supplier.productListUrl, supplier.code);

        await execute(productList);
      } else if (supplier.targetTypeCode === "JSONOKE") {
        const productList = await parseJsonOkeProduct(supplier.productListUrl, supplier.code);

        await execute(productList);
      }
    }),
  );

  const productSuppliers = await db
    .select({
      productCode: schema.productSuppliers.productCode,
      supplierCode: schema.productSuppliers.supplierCode,
      supplierProductCode: schema.productSuppliers.supplierProductCode,
      price: schema.productSuppliers.price,
    })
    .from(schema.productSuppliers)
    .orderBy(asc(schema.productSuppliers.updatedAt))
    .limit(5000);

  await Promise.all(
    productSuppliers.map(async (productSupplier) => {
      const supplier = data.find((item) => item.supplierCode === productSupplier.supplierCode);

      if (supplier) {
        const productData = supplier.productMap.get(productSupplier.supplierProductCode);

        if (productData) {
          if (productData.price !== productSupplier.price) {
            const status = productData.status ? "active" : "inactive";
            const title = `${productData.title} (${productData.provider})`;
            const price = productData.price;

            await db
              .update(schema.productSuppliers)
              .set({ title, price, status })
              .where(
                and(
                  eq(schema.productSuppliers.productCode, productSupplier.productCode),
                  eq(schema.productSuppliers.supplierCode, productSupplier.supplierCode),
                  eq(
                    schema.productSuppliers.supplierProductCode,
                    productSupplier.supplierProductCode,
                  ),
                ),
              );
          }
        } else {
          if (productSupplier.price !== 0) {
            await db
              .update(schema.productSuppliers)
              .set({
                title: null,
                price: 0,
                status: "not-found",
              })
              .where(
                and(
                  eq(schema.productSuppliers.productCode, productSupplier.productCode),
                  eq(schema.productSuppliers.supplierCode, productSupplier.supplierCode),
                  eq(
                    schema.productSuppliers.supplierProductCode,
                    productSupplier.supplierProductCode,
                  ),
                ),
              );
          }
        }
      }
    }),
  );

  return c.json(
    httpResponse.success(null, `${productSuppliers.length} records successfully updated`),
    200,
  );
});

app.get("/sync/last-synced", async (c) => {
  const [result] = await db
    .select({ lastSyncedAt: schema.suppliers.lastSyncedAt })
    .from(schema.suppliers)
    .orderBy(desc(schema.suppliers.lastSyncedAt))
    .limit(1);

  return c.json(httpResponse.success(result ?? null, responseMessage.success), 200);
});

export default {
  port: 3001,
  fetch: app.fetch,
};
