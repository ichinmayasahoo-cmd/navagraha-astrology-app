// Indian (Vedic) numerology: Mulank (Root/Driver number) and Bhagyank (Destiny/Life-path number)

function reduceToSingleDigit(num) {
  num = Math.abs(Math.trunc(num));
  while (num > 9) {
    num = String(num)
      .split('')
      .reduce((sum, d) => sum + Number(d), 0);
  }
  return num;
}

const MULANK_TRAITS = {
  1: 'Leadership, independence, originality, drive to be first.',
  2: 'Sensitivity, diplomacy, cooperation, emotional intelligence.',
  3: 'Creativity, communication, optimism, self-expression.',
  4: 'Discipline, stability, hard work, practicality.',
  5: 'Freedom, adaptability, curiosity, love of change.',
  6: 'Responsibility, harmony, nurturing, love of beauty.',
  7: 'Introspection, analysis, spirituality, research.',
  8: 'Ambition, material success, authority, resilience.',
  9: 'Compassion, idealism, humanitarianism, completion.'
};

const BHAGYANK_TRAITS = {
  1: 'A destiny built around leading, initiating and standing on your own.',
  2: 'A destiny built around partnership, patience and supporting others.',
  3: 'A destiny built around creative expression and inspiring people.',
  4: 'A destiny built around building solid, lasting foundations.',
  5: 'A destiny built around change, travel and versatile experiences.',
  6: 'A destiny built around family, duty, and caretaking of others.',
  7: 'A destiny built around wisdom, solitude and inner knowledge.',
  8: 'A destiny built around power, business and material mastery.',
  9: 'A destiny built around service, closure and giving back.'
};

/**
 * @param {number} day 1-31
 * @param {number} month 1-12
 * @param {number} year e.g. 1998
 */
function calculateNumerology(day, month, year) {
  const mulank = reduceToSingleDigit(day);

  const fullDigitSum = `${day}${month}${year}`
    .split('')
    .reduce((sum, d) => sum + Number(d), 0);
  const bhagyank = reduceToSingleDigit(fullDigitSum);

  return {
    mulank,
    mulankTrait: MULANK_TRAITS[mulank],
    bhagyank,
    bhagyankTrait: BHAGYANK_TRAITS[bhagyank]
  };
}

module.exports = { calculateNumerology, reduceToSingleDigit };
