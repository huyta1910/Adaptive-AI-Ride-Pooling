export interface ApiResponse<TData> {
  data: TData;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AppRoute {
  path: string;
  label: string;
}
