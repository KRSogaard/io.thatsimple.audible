export const formatNumber = (s: string): string => {
    let rightDot = s.split('.');
    let addDot = '';
    if (s.endsWith('.')) {
        addDot = '.';
    } else if (rightDot.length >= 2) {
        addDot = '.' + rightDot[1];
    }
    var commas = parse(s).toLocaleString('en-US');
    commas = commas.split('.')[0] + addDot;
    return commas;
};

export const parse = (v: string): number => {
    if (!v || v === '' || v === undefined) {
        return 0;
    }
    return parseFloat(v.toString().replace(/,/g, ''));
};
export const isNumeric = (str: string): boolean => {
    if (!str || str === '' || str === undefined) {
        return false;
    }
    return Number(str.toString().replace(/,/g, '')) !== NaN;
};
