export function camelize(text: string) {
  let WordsArray = text.split(' ');
  let CamelCaseValue = '';
  for (let index = 0; index < WordsArray.length; index++) {
    let singleWord = WordsArray[index];
    singleWord.charAt(0).toUpperCase();
    singleWord = singleWord.charAt(0).toUpperCase() + singleWord.slice(1);

    CamelCaseValue += ' ' + singleWord;
  }
  CamelCaseValue = CamelCaseValue.trim();
  return CamelCaseValue;
}
