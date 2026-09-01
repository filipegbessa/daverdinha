export function shouldEnableAnalytics(): boolean {
  return !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
}
