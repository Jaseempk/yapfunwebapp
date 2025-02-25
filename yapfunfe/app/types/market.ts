export type OrderBookEntry = {
  price: number;
  size: number;
  total: number;
};

export type OrderError = {
  code: string;
  message: string;
  data?: unknown;
};

export type LoadingState = Record<
  "order" | "balance" | "chart" | "orderBook",
  boolean
>;

export type ChartDataPoint = {
  time: string;
  value: number;
};

export type OrderBookData = {
  sells: OrderBookEntry[];
  buys: OrderBookEntry[];
};
