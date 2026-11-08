import { Cache } from "@utils/cache";

export async function parseJsonOkeProduct(url: string, code: string): Promise<ProductData[]> {
  if (Cache.has(code)) {
    return Cache.get(code) as ProductData[];
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      Connection: "keep-alive",
    },
  });
  const json = (await response.json()) as {
    kode: string;
    keterangan: string;
    produk: string;
    kategori: string;
    harga: string;
    status: string;
  }[];
  const products: ProductData[] = [];

  json.forEach((item) => {
    products.push({
      code: item.kode,
      title: item.keterangan,
      provider: item.produk,
      price: Number(item.harga) || 0,
      status: item.status === "1" ? true : false,
    });
  });

  Cache.set(code, products);

  return products;
}
