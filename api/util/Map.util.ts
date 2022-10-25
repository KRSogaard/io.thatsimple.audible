export const createMapPart = (values: any): string => {
  return replaceProtected(JSON.stringify(values)) + '|';
};

export const parseMap = (map: string): any[] => {
  if (!map || map === '') {
    return [];
  }

  let values = map.split('|');
  let result: string[][] = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] === null || values[i] === '') {
      continue;
    }
    result.push(JSON.parse(replaceBack(values[i])));
  }
  return result;
};

export const replaceBack = (value: string): string => {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace('!&!', '|');
};

export const replaceProtected = (value: string): string => {
  if (typeof value !== 'string') {
    return value;
  }
  return value.replace('|', '!&!');
};
