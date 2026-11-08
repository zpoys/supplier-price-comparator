import * as v from "valibot";

const BUSINESS_CODE = v.pipe(
  v.string(),
  v.minLength(1),
  v.maxLength(16),
  v.regex(/^[A-Z][A-Z0-9_]*$/, "Invalid code"),
);
const EXTERNAL_CODE = v.pipe(v.string(), v.minLength(1), v.maxLength(500));
const NAME = v.pipe(v.string(), v.minLength(1), v.maxLength(64));
const TARGET_URL = v.pipe(v.string(), v.minLength(3), v.maxLength(500));
const QUICK_SEARCH = v.pipe(v.string(), v.maxLength(16));
const BASIC_SEARCH = v.pipe(v.string(), v.maxLength(32));

export const loginUserBodySchema = v.object({
  username: v.pipe(v.string(), v.minLength(1), v.maxLength(16)),
  password: v.pipe(v.string(), v.minLength(1), v.maxLength(18)),
});

export const createTargetTypeBodySchema = v.object({
  code: BUSINESS_CODE,
  name: NAME,
});

export const findTargetTypeQuerySchema = v.object({
  code: v.optional(QUICK_SEARCH),
  name: v.optional(BASIC_SEARCH),
});

export const createProviderBodySchema = v.object({
  code: BUSINESS_CODE,
  name: NAME,
});

export const findProviderQuerySchema = v.object({
  code: v.optional(QUICK_SEARCH),
  name: v.optional(BASIC_SEARCH),
});

export const updateProviderBodySchema = v.object({
  code: v.optional(BUSINESS_CODE),
  name: v.optional(NAME),
});

export const createProductBodySchema = v.object({
  code: BUSINESS_CODE,
  providerCode: BUSINESS_CODE,
  name: NAME,
});

export const findProductQuerySchema = v.object({
  code: v.optional(QUICK_SEARCH),
  providerCode: v.optional(QUICK_SEARCH),
  name: v.optional(BASIC_SEARCH),
});

export const updateProductBodySchema = v.object({
  code: v.optional(BUSINESS_CODE),
  providerCode: v.optional(BUSINESS_CODE),
  name: v.optional(NAME),
});

export const createSupplierBodySchema = v.object({
  code: BUSINESS_CODE,
  targetTypeCode: BUSINESS_CODE,
  name: NAME,
  productListUrl: TARGET_URL,
});

export const findSupplierQuerySchema = v.object({
  code: v.optional(QUICK_SEARCH),
  targetTypeCode: v.optional(QUICK_SEARCH),
  name: v.optional(BASIC_SEARCH),
});

export const updateSupplierBodySchema = v.object({
  code: v.optional(BUSINESS_CODE),
  targetTypeCode: v.optional(BUSINESS_CODE),
  name: v.optional(NAME),
  productListUrl: v.optional(TARGET_URL),
});

export const createProductSupplierBodySchema = v.object({
  productCode: BUSINESS_CODE,
  supplierCode: BUSINESS_CODE,
  supplierProductCode: EXTERNAL_CODE,
});

export const findProductSupplierQuerySchema = v.object({
  productCode: v.optional(QUICK_SEARCH),
  supplierCode: v.optional(QUICK_SEARCH),
  supplierProductCode: v.optional(QUICK_SEARCH),
});

export const updateProductSupplierBodySchema = v.object({
  productCode: v.optional(BUSINESS_CODE),
  supplierCode: v.optional(BUSINESS_CODE),
  supplierProductCode: v.optional(EXTERNAL_CODE),
});
