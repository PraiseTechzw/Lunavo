/**
 * Escalation rules for detecting crisis situations
 * Posts matching these patterns will be automatically flagged
 */

import { EscalationRule, PostCategory } from '@/types';

export const ESCALATION_RULES: EscalationRule[] = [
  {
    keywords: [
      'suicide',
      'kill myself',
      'end my life',
      'want to die',
      'not worth living',
      'better off dead',
      'suicidal',
      'ending it',
      'no point',
    ],
    phrases: [
      'going to kill myself',
      'planning to end my life',
      'thinking about suicide',
      'want to commit suicide',
      'suicide is the only way',
    ],
    level: 'critical',
    category: ['crisis', 'mental-health'],
  },
  {
    keywords: [
      'self harm',
      'cutting',
      'hurting myself',
      'self injury',
      'burning myself',
    ],
    phrases: [
      'want to hurt myself',
      'going to cut myself',
      'thinking of self harm',
    ],
    level: 'high',
    category: ['crisis', 'mental-health'],
  },
  {
    keywords: [
      'abuse',
      'raped',
      'assaulted',
      'violence',
      'threatened',
      'harassed',
    ],
    phrases: [
      'being abused',
      'someone hurt me',
      'afraid for my safety',
      'being threatened',
    ],
    level: 'high',
    category: ['crisis', 'social', 'relationships'],
  },
  {
    keywords: [
      'overdose',
      'too much',
      'can\'t stop',
      'addicted',
      'withdrawal',
    ],
    phrases: [
      'took too many pills',
      'overdosed on',
      'can\'t control my use',
    ],
    level: 'high',
    category: ['substance-abuse', 'crisis'],
  },
  {
    keywords: [
      'hiv positive',
      'tested positive',
      'stis',
      'std',
      'unsafe sex',
      'unprotected',
      'pregnancy scare',
      'unwanted pregnancy',
    ],
    phrases: [
      'tested positive for hiv',
      'might have hiv',
      'had unprotected sex',
      'worried about pregnancy',
      'think i have an sti',
    ],
    level: 'medium',
    category: ['stis-hiv', 'sexual-health', 'crisis'],
  },
  {
    keywords: [
      'family problems',
      'family stress',
      'home issues',
      'family health',
      'parent sick',
      'family crisis',
    ],
    phrases: [
      'family is causing stress',
      'problems at home',
      'family member is sick',
      'home situation is bad',
    ],
    level: 'low',
    category: ['family-home', 'mental-health'],
  },
  {
    keywords: [
      'hopeless',
      'helpless',
      'can\'t cope',
      'breaking down',
      'losing control',
      'panic attack',
    ],
    phrases: [
      'completely hopeless',
      'can\'t handle this anymore',
      'having a breakdown',
      'losing my mind',
    ],
    level: 'medium',
    category: ['mental-health', 'crisis'],
  },
  {
    keywords: [
      'depressed',
      'anxious',
      'stressed',
      'overwhelmed',
      'exhausted',
    ],
    phrases: [
      'feeling very depressed',
      'extreme anxiety',
      'completely overwhelmed',
    ],
    level: 'low',
    category: ['mental-health', 'academic'],
  },
];

/**
 * Check if content should be escalated
 */
export function checkEscalation(
  content: string,
  category: PostCategory
): { level: 'none' | 'low' | 'medium' | 'high' | 'critical'; reason?: string } {
  const lowerContent = content.toLowerCase();
  
  for (const rule of ESCALATION_RULES) {
    // Check if category matches
    if (!rule.category.includes(category) && !rule.category.includes('crisis')) {
      continue;
    }
    
    // Check keywords
    for (const keyword of rule.keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        return {
          level: rule.level,
          reason: `Detected keyword: "${keyword}"`,
        };
      }
    }
    
    // Check phrases
    for (const phrase of rule.phrases) {
      if (lowerContent.includes(phrase.toLowerCase())) {
        return {
          level: rule.level,
          reason: `Detected phrase: "${phrase}"`,
        };
      }
    }
  }
  
  return { level: 'none' };
}




