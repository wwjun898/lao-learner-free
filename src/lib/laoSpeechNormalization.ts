const thaiCharacters = Array.from(
  'กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮะัาำิีึืุูเแโใไๅ่้๊๋์ๆฯ',
);
const laoCharacters = Array.from(
  'ກຂຂຄຄຄງຈສຊຊຊຍດຕຖທທນດຕຖທທນບປຜຝພຟພມຍຣລວສສສຫລອຮະັາຳິີຶືຸູເແໂໃໄາ່້໊໋໌ໆຯ',
);
const thaiToLao = new Map(thaiCharacters.map((character, index) => [character, laoCharacters[index]]));
thaiToLao.set('็', '');

export function normalizeRecognizedLao(text: string): string {
  return Array.from(text.normalize('NFC'), character => thaiToLao.get(character) ?? character)
    .join('')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .trim();
}

export function laoTextSimilarity(left: string, right: string): number {
  const a = normalizeRecognizedLao(left).toLowerCase().replace(/[.,!?;:\s]/g, '');
  const b = normalizeRecognizedLao(right).toLowerCase().replace(/[.,!?;:\s]/g, '');
  if (!a || !b) return 0;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return Math.max(0, Math.round((1 - previous[b.length] / Math.max(a.length, b.length)) * 100));
}
