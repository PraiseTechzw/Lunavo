/**
 * AI Utilities - Smart Post Categorization, Sentiment Detection, and Keyword Extraction
 */

import { Post, PostCategory } from '@/types';

// ============================================
// POST CATEGORIZATION
// ============================================

export interface CategorizationResult {
  category: PostCategory;
  confidence: number;
  alternativeCategories?: Array<{ category: PostCategory; confidence: number }>;
  keywords: string[];
}

/**
 * Categorize a post based on its content
 * Uses keyword matching and content analysis
 */
export function categorizePost(title: string, content: string, currentCategory?: PostCategory): CategorizationResult {
  const text = `${title} ${content}`.toLowerCase();
  
  // Category keywords and weights
  const categoryKeywords: Record<PostCategory, { keywords: string[]; weight: number }> = {
    'mental-health': {
      keywords: [
        'anxiety', 'depression', 'stress', 'panic', 'overwhelmed', 'sad', 'lonely',
        'mental health', 'therapy', 'counseling', 'suicidal', 'self-harm', 'trauma',
        'ptsd', 'bipolar', 'adhd', 'ocd', 'eating disorder', 'burnout', 'exhausted'
      ],
      weight: 1.0,
    },
    'relationships': {
      keywords: [
        'relationship', 'breakup', 'dating', 'friend', 'family', 'partner', 'boyfriend',
        'girlfriend', 'conflict', 'argument', 'communication', 'trust', 'cheating',
        'loneliness', 'social', 'isolation', 'romance', 'marriage', 'divorce'
      ],
      weight: 1.0,
    },
    'academic': {
      keywords: [
        'exam', 'test', 'assignment', 'homework', 'study', 'grades', 'gpa', 'course',
        'professor', 'lecture', 'deadline', 'project', 'essay', 'research', 'thesis',
        'dissertation', 'academic', 'university', 'college', 'school', 'failing',
        'dropout', 'graduation', 'career', 'job', 'internship'
      ],
      weight: 1.0,
    },
    'crisis': {
      keywords: [
        'suicide', 'kill myself', 'end it all', 'want to die', 'no point', 'hopeless',
        'emergency', 'urgent', 'help now', 'can\'t cope', 'breaking down', 'crisis',
        'self-harm', 'cutting', 'overdose', 'abuse', 'violence', 'danger', 'unsafe'
      ],
      weight: 2.0, // Higher weight for crisis
    },
    'substance-abuse': {
      keywords: [
        'alcohol', 'drug', 'addiction', 'sober', 'recovery', 'drinking', 'smoking',
        'marijuana', 'cannabis', 'cocaine', 'heroin', 'opioid', 'substance', 'abuse',
        'relapse', 'detox', 'rehab', 'alcoholic', 'addict'
      ],
      weight: 1.0,
    },
    'sexual-health': {
      keywords: [
        'sex', 'sexual', 'std', 'sti', 'contraception', 'condom', 'pregnancy',
        'abortion', 'reproductive', 'health', 'consent', 'assault', 'harassment',
        'intimacy', 'relationship', 'dating', 'safe sex'
      ],
      weight: 1.0,
    },
  };

  // Calculate scores for each category
  const scores: Record<PostCategory, number> = {
    'mental-health': 0,
    'relationships': 0,
    'academic': 0,
    'crisis': 0,
    'substance-abuse': 0,
    'sexual-health': 0,
  };

  Object.entries(categoryKeywords).forEach(([category, data]) => {
    let score = 0;
    data.keywords.forEach((keyword) => {
      const matches = (text.match(new RegExp(keyword, 'gi')) || []).length;
      score += matches * data.weight;
    });
    scores[category as PostCategory] = score;
  });

  // If current category is provided and has a score, boost it slightly
  if (currentCategory && scores[currentCategory] > 0) {
    scores[currentCategory] *= 1.2;
  }

  // Find the category with the highest score
  const sortedCategories = Object.entries(scores)
    .map(([category, score]) => ({ category: category as PostCategory, score }))
    .sort((a, b) => b.score - a.score);

  const topCategory = sortedCategories[0];
  const totalScore = sortedCategories.reduce((sum, item) => sum + item.score, 0);

  // Calculate confidence (0-1)
  const confidence = totalScore > 0 ? Math.min(topCategory.score / (totalScore || 1), 1) : 0.5;

  // Extract keywords that matched
  const matchedKeywords: string[] = [];
  const topCategoryData = categoryKeywords[topCategory.category];
  topCategoryData.keywords.forEach((keyword) => {
    if (text.includes(keyword.toLowerCase())) {
      matchedKeywords.push(keyword);
    }
  });

  // Get alternative categories (top 3 excluding the top one)
  const alternativeCategories = sortedCategories
    .slice(1, 4)
    .filter((item) => item.score > 0)
    .map((item) => ({
      category: item.category,
      confidence: totalScore > 0 ? Math.min(item.score / (totalScore || 1), 1) : 0,
    }));

  return {
    category: topCategory.category,
    confidence,
    alternativeCategories: alternativeCategories.length > 0 ? alternativeCategories : undefined,
    keywords: matchedKeywords.slice(0, 10), // Top 10 keywords
  };
}

// ============================================
// SENTIMENT DETECTION
// ============================================

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'crisis';
  score: number; // -1 (very negative) to 1 (very positive)
  confidence: number;
  emotions: string[];
}

/**
 * Detect sentiment of a post
 */
export function detectSentiment(title: string, content: string): SentimentResult {
  const text = `${title} ${content}`.toLowerCase();

  // Positive indicators
  const positiveWords = [
    'happy', 'glad', 'excited', 'grateful', 'thankful', 'proud', 'confident',
    'hopeful', 'optimistic', 'better', 'improved', 'progress', 'success',
    'achievement', 'accomplished', 'relieved', 'peaceful', 'calm', 'content'
  ];

  // Negative indicators
  const negativeWords = [
    'sad', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious', 'scared',
    'afraid', 'lonely', 'isolated', 'hurt', 'pain', 'suffering', 'struggling',
    'difficult', 'hard', 'tough', 'overwhelmed', 'exhausted', 'tired', 'drained'
  ];

  // Crisis indicators (very negative)
  const crisisWords = [
    'suicide', 'kill myself', 'end it all', 'want to die', 'hopeless', 'no point',
    'can\'t go on', 'give up', 'self-harm', 'cutting', 'overdose', 'emergency'
  ];

  // Count matches
  const positiveCount = positiveWords.filter((word) => text.includes(word)).length;
  const negativeCount = negativeWords.filter((word) => text.includes(word)).length;
  const crisisCount = crisisWords.filter((word) => text.includes(word)).length;

  // Calculate score
  let score = 0;
  let sentiment: 'positive' | 'neutral' | 'negative' | 'crisis' = 'neutral';
  const emotions: string[] = [];

  if (crisisCount > 0) {
    sentiment = 'crisis';
    score = -1;
    emotions.push('crisis', 'despair', 'hopelessness');
  } else if (negativeCount > positiveCount) {
    sentiment = 'negative';
    score = -Math.min(negativeCount / 10, 1);
    if (negativeCount > 5) emotions.push('distress', 'sadness');
    if (text.includes('anxious') || text.includes('worried')) emotions.push('anxiety');
    if (text.includes('angry') || text.includes('frustrated')) emotions.push('anger');
  } else if (positiveCount > negativeCount) {
    sentiment = 'positive';
    score = Math.min(positiveCount / 10, 1);
    if (positiveCount > 3) emotions.push('happiness', 'optimism');
  } else {
    sentiment = 'neutral';
    score = 0;
  }

  // Calculate confidence based on word count
  const totalWords = text.split(/\s+/).length;
  const matchedWords = positiveCount + negativeCount + crisisCount;
  const confidence = Math.min(matchedWords / Math.max(totalWords / 20, 1), 1);

  return {
    sentiment,
    score,
    confidence,
    emotions: emotions.length > 0 ? emotions : ['neutral'],
  };
}

// ============================================
// KEYWORD EXTRACTION
// ============================================

export interface ExtractedKeywords {
  keywords: string[];
  importantPhrases: string[];
  topics: string[];
}

/**
 * Extract keywords and important phrases from text
 */
export function extractKeywords(title: string, content: string): ExtractedKeywords {
  const text = `${title} ${content}`.toLowerCase();

  // Common stop words to ignore
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now'
  ]);

  // Extract words (3+ characters, not stop words)
  const words = text
    .split(/\s+/)
    .map((word) => word.replace(/[^\w]/g, ''))
    .filter((word) => word.length >= 3 && !stopWords.has(word));

  // Count word frequency
  const wordFreq: Record<string, number> = {};
  words.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Get top keywords (appearing 2+ times or in title)
  const titleWords = title.toLowerCase().split(/\s+/).map((w) => w.replace(/[^\w]/g, ''));
  const keywords = Object.entries(wordFreq)
    .filter(([word, count]) => count >= 2 || titleWords.includes(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);

  // Extract important phrases (2-3 word combinations)
  const phrases: Record<string, number> = {};
  const wordsArray = text.split(/\s+/);
  for (let i = 0; i < wordsArray.length - 1; i++) {
    const phrase2 = `${wordsArray[i]} ${wordsArray[i + 1]}`.toLowerCase().replace(/[^\w\s]/g, '');
    if (phrase2.split(/\s+/).every((w) => !stopWords.has(w) && w.length >= 2)) {
      phrases[phrase2] = (phrases[phrase2] || 0) + 1;
    }
    if (i < wordsArray.length - 2) {
      const phrase3 = `${wordsArray[i]} ${wordsArray[i + 1]} ${wordsArray[i + 2]}`
        .toLowerCase()
        .replace(/[^\w\s]/g, '');
      if (phrase3.split(/\s+/).every((w) => !stopWords.has(w) && w.length >= 2)) {
        phrases[phrase3] = (phrases[phrase3] || 0) + 1;
      }
    }
  }

  const importantPhrases = Object.entries(phrases)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase]) => phrase);

  // Identify topics (common mental health, academic, relationship topics)
  const topicKeywords: Record<string, string[]> = {
    'anxiety': ['anxiety', 'anxious', 'worry', 'panic', 'stress'],
    'depression': ['depression', 'depressed', 'sad', 'hopeless', 'down'],
    'academic-stress': ['exam', 'test', 'assignment', 'deadline', 'grades'],
    'relationships': ['relationship', 'friend', 'partner', 'breakup', 'conflict'],
    'self-care': ['self-care', 'wellness', 'health', 'exercise', 'sleep'],
  };

  const topics: string[] = [];
  Object.entries(topicKeywords).forEach(([topic, keywords]) => {
    if (keywords.some((kw) => text.includes(kw))) {
      topics.push(topic);
    }
  });

  return {
    keywords,
    importantPhrases,
    topics,
  };
}

// ============================================
// COMBINED ANALYSIS
// ============================================

export interface PostAnalysis {
  categorization: CategorizationResult;
  sentiment: SentimentResult;
  keywords: ExtractedKeywords;
  suggestedTags: string[];
}

/**
 * Perform complete analysis of a post
 */
export function analyzePost(
  title: string,
  content: string,
  currentCategory?: PostCategory
): PostAnalysis {
  const categorization = categorizePost(title, content, currentCategory);
  const sentiment = detectSentiment(title, content);
  const keywords = extractKeywords(title, content);

  // Generate suggested tags from keywords and topics
  const suggestedTags = [
    ...keywords.keywords.slice(0, 5),
    ...keywords.topics,
    ...sentiment.emotions.slice(0, 2),
  ].slice(0, 8);

  return {
    categorization,
    sentiment,
    keywords,
    suggestedTags,
  };
}

