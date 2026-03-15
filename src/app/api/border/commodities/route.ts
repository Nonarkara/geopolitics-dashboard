import { NextResponse } from "next/server";

export const revalidate = 3600;

interface NABCRecord {
  data_date: string;
  product_category: string;
  product_name: string;
  market_name: string;
  province: string;
  day_price: number;
  unit: string;
}

interface NABCResponse {
  success: boolean;
  data: NABCRecord[];
}

export interface CommodityPrice {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  unit: string;
  market: string;
  date: string;
}

const BORDER_COMMODITIES: { thai: string; english: string }[] = [
  { thai: "ข้าวหอมมะลิ", english: "Jasmine Rice" },
  { thai: "ยางพารา", english: "Rubber" },
  { thai: "มันสำปะหลัง", english: "Cassava" },
  { thai: "ปาล์มน้ำมัน", english: "Oil Palm" },
  { thai: "ข้าวโพดเลี้ยงสัตว์", english: "Feed Corn" },
  { thai: "สุกร", english: "Pork" },
];

const FALLBACK: CommodityPrice[] = [
  { id: "rice", name: "ข้าวหอมมะลิ 105", nameEn: "Jasmine Rice 105", price: 15800, unit: "฿/ton", market: "Central Market", date: "2026-03-13" },
  { id: "rubber", name: "ยางแผ่นดิบ ชั้น 3", nameEn: "Rubber Sheet G3", price: 69, unit: "฿/kg", market: "Surat Thani", date: "2026-03-13" },
  { id: "cassava", name: "มันสำปะหลังสด", nameEn: "Fresh Cassava", price: 2.65, unit: "฿/kg", market: "Nakhon Ratchasima", date: "2026-03-13" },
  { id: "palm", name: "ผลปาล์มน้ำมัน", nameEn: "Oil Palm Fruit", price: 6.80, unit: "฿/kg", market: "Surat Thani", date: "2026-03-13" },
  { id: "corn", name: "ข้าวโพดเลี้ยงสัตว์", nameEn: "Feed Corn", price: 9.50, unit: "฿/kg", market: "Nakhon Sawan", date: "2026-03-13" },
  { id: "pork", name: "สุกรพันธุ์ผสม", nameEn: "Pork (mixed breed)", price: 58, unit: "฿/kg", market: "Nakhon Pathom", date: "2026-03-13" },
];

async function fetchCategory(thai: string, english: string): Promise<CommodityPrice | null> {
  try {
    const url = `https://agriapi.nabc.go.th/api/daily-prices/product?product_name=${encodeURIComponent(thai)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const json: NABCResponse = await res.json();
    if (!json.success || !json.data || json.data.length === 0) return null;

    const record = json.data[0];
    return {
      id: english.toLowerCase().replace(/\s+/g, "-"),
      name: record.product_name,
      nameEn: english,
      price: record.day_price,
      unit: record.unit,
      market: record.market_name,
      date: record.data_date,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const results = await Promise.all(
      BORDER_COMMODITIES.map((c) => fetchCategory(c.thai, c.english))
    );

    const prices = results.filter((r): r is CommodityPrice => r !== null);
    return NextResponse.json(prices.length > 0 ? prices : FALLBACK);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
