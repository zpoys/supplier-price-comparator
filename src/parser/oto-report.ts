import { Cache } from "@utils/cache";
import { parse } from "node-html-parser";

export async function parseOtoReportProduct(url: string, code: string): Promise<ProductData[]> {
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
  const html = await response.text();
  const dom = parse(html);
  const products: ProductData[] = [];
  const providerElems = dom.querySelectorAll(".tablewrapper");

  providerElems.forEach((providerElem) => {
    const provider = providerElem.querySelector(".head")?.textContent.trim() || "Unknown";
    const product1Elems = providerElem.querySelectorAll(".td1");
    const product2Elems = providerElem.querySelectorAll(".td2");

    product1Elems.forEach((product1Elem) => {
      const itemElems = product1Elem.querySelectorAll("td");

      if (itemElems.length > 0) {
        const code = itemElems[0]?.textContent.trim() || "Unknown";
        const title = itemElems[1]?.textContent.trim() || "Unknown";
        const price = itemElems[2]?.textContent.trim().replace(/\./g, "") || "Unknown";
        const status = itemElems[3]?.textContent.trim() || "Unknown";

        products.push({
          code,
          title,
          provider,
          price: Number(price) || 0,
          status: status === "Open" ? true : false,
        });
      }
    });

    product2Elems.forEach((product2Elem) => {
      const itemElems = product2Elem.querySelectorAll("td");

      if (itemElems.length > 0) {
        const code = itemElems[0]?.textContent.trim() || "Unknown";
        const title = itemElems[1]?.textContent.trim() || "Unknown";
        const status = itemElems[3]?.textContent.trim() || "Unknown";
        const price = itemElems[2]?.textContent.trim().replace(/\./g, "") || "Unknown";

        products.push({
          code,
          title,
          provider,
          price: Number(price) || 0,
          status: status === "Open" ? true : false,
        });
      }
    });
  });

  Cache.set(code, products);

  return products;
}
