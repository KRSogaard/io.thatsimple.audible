export const dateFromTimestamp = (timestamp: number): Date => {
  return new Date(timestamp * 1000);
};
export const getNowTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};
export const datetoTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};
