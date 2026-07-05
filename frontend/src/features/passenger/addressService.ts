import axios from "axios";
import type { AddressOption } from "@/features/passenger/types";

type ProvinceRow = {
  code: number | string;
  name: string;
};

type WardRow = {
  code: number | string;
  name: string;
  province_code: number | string;
};

type ProvinceWithWardsRow = ProvinceRow & {
  wards?: WardRow[];
};

const vietnamAdminClient = axios.create({
  baseURL: "https://provinces.open-api.vn/api/v2",
  timeout: 10_000,
});

let provinceCache: AddressOption[] | null = null;
const wardsByProvince = new Map<string, AddressOption[]>();

function sortByVietnameseName<TOption extends { name: string }>(options: TOption[]): TOption[] {
  return [...options].sort((left, right) => left.name.localeCompare(right.name, "vi"));
}

function mapProvince(row: ProvinceRow): AddressOption {
  return {
    code: String(row.code),
    name: row.name,
  };
}

function mapWard(row: WardRow): AddressOption {
  return {
    code: String(row.code),
    name: row.name,
  };
}

export const addressApi = {
  async getProvinces(): Promise<AddressOption[]> {
    if (provinceCache) {
      return sortByVietnameseName(provinceCache);
    }

    const response = await vietnamAdminClient.get<ProvinceRow[]>("/p/");
    provinceCache = response.data.map(mapProvince);
    return sortByVietnameseName(provinceCache);
  },

  async getWards(provinceCode: string): Promise<AddressOption[]> {
    if (!provinceCode) {
      return [];
    }

    const cachedWards = wardsByProvince.get(provinceCode);
    if (cachedWards) {
      return sortByVietnameseName(cachedWards);
    }

    const response = await vietnamAdminClient.get<ProvinceWithWardsRow>(`/p/${provinceCode}`, {
      params: { depth: 2 },
    });
    const wards = (response.data.wards ?? [])
      .filter((ward) => String(ward.province_code) === provinceCode)
      .map(mapWard);
    wardsByProvince.set(provinceCode, wards);
    return sortByVietnameseName(wards);
  },
};

export const getProvinces = addressApi.getProvinces;
export const getWards = addressApi.getWards;
