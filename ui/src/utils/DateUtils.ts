export const EpocToDate = (epoch: number): Date => {
  return new Date(epoch * 1000);
};
