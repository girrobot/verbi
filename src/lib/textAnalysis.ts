interface AnalysisResult {
  passiveVoice: string[];
  complexSentences: string[];
  adverbs: string[];
  readabilityScore: number;
  suggestions: string[];
}

export function analyzeText(text: string): AnalysisResult {
  // Split text into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  const passiveVoice = findPassiveVoice(sentences);
  const complexSentences = findComplexSentences(sentences);
  const adverbs = findAdverbs(text);
  const readabilityScore = calculateReadabilityScore(text);
  
  return {
    passiveVoice,
    complexSentences,
    adverbs,
    readabilityScore,
    suggestions: generateSuggestions({ passiveVoice, complexSentences, adverbs })
  };
}

function findPassiveVoice(sentences: string[]): string[] {
  // Basic passive voice detection (can be improved)
  const passivePattern = /\b(am|is|are|was|were|been|be|being)\b\s+\w+ed\b/i;
  return sentences.filter(sentence => passivePattern.test(sentence));
}

function findComplexSentences(sentences: string[]): string[] {
  return sentences.filter(sentence => {
    const words = sentence.split(/\s+/);
    const commas = (sentence.match(/,/g) || []).length;
    return words.length > 20 || commas > 2;
  });
}

function findAdverbs(text: string): string[] {
  // Basic adverb detection (words ending in 'ly')
  const adverbPattern = /\w+ly\b/g;
  return text.match(adverbPattern) || [];
}

function calculateReadabilityScore(text: string): number {
  const words = text.split(/\s+/).length;
  const sentences = (text.match(/[.!?]+/g) || []).length;
  const syllables = countSyllables(text);
  
  // Flesch-Kincaid Grade Level
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}

function countSyllables(text: string): number {
  // Basic syllable counting (can be improved)
  return text.toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/[^aeiouy]*[aeiouy]+/g, 'a')
    .length;
}

function generateSuggestions(analysis: Partial<AnalysisResult>): string[] {
  const suggestions: string[] = [];
  
  if (analysis.passiveVoice?.length > 0) {
    suggestions.push('Consider using active voice for clearer writing');
  }
  
  if (analysis.complexSentences?.length > 0) {
    suggestions.push('Try breaking down long sentences for better readability');
  }
  
  if (analysis.adverbs?.length > 3) {
    suggestions.push('Use stronger verbs instead of adverbs where possible');
  }
  
  return suggestions;
} 