type KakaoDynamic = {
  [key: string]: KakaoDynamic;
} & ((...args: unknown[]) => KakaoDynamic) &
  (new (...args: unknown[]) => KakaoDynamic);

declare global {
  interface Window {
    kakao: KakaoDynamic;
  }
}

export namespace KakaoBounds {
  // minimalist typing
}
