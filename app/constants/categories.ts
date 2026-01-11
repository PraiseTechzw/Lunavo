/**
 * Category definitions for support posts
 */

import { Category, PostCategory } from '@/app/types';
import { Colors } from './theme';

export const CATEGORIES: Record<PostCategory, Category> = {
  'mental-health': {
    id: 'mental-health',
    name: 'Mental Health Support',
    description: 'Stress, depression, anxiety, suicidal thoughts, and emotional wellbeing',
    icon: 'leaf-outline',
    color: Colors.light.secondary, // Violet
    resources: [
      'CUT Counseling Services: +263 67 22203-5 Ext. 1297',
      'Zimbabwe Lifeline: +263 4 700 800',
      'Mental Health Helpline: +263 4 700 800',
    ],
  },
  'substance-abuse': {
    id: 'substance-abuse',
    name: 'Drug & Substance Abuse',
    description: 'Support for drug and alcohol related concerns, addiction recovery',
    icon: 'medkit-outline',
    color: Colors.light.warning, // Amber
    resources: [
      'CUT Student Affairs - Drug & Substance Abuse Section: +263 67 22203-5 Ext. 1297',
      'Zimbabwe National AIDS Council: +263 4 791 000',
      'Peer Educator Club Support',
    ],
  },
  'sexual-health': {
    id: 'sexual-health',
    name: 'Sexual & Reproductive Health (SRH)',
    description: 'Safe sex, reproductive health, and family planning',
    icon: 'heart-outline',
    color: '#EC4899', // Pink
    resources: [
      'CUT Health Services: +263 67 22203-5',
      'Zimbabwe National AIDS Council: +263 4 791 000',
      'SRH Counseling Services',
    ],
  },
  'stis-hiv': {
    id: 'stis-hiv',
    name: 'STIs/HIV & Safe Sex Education',
    description: 'STI prevention, HIV testing, safe sex practices, and education',
    icon: 'shield-checkmark-outline',
    color: '#EC4899',
    resources: [
      'Zimbabwe National AIDS Council: +263 4 791 000',
      'CUT Health Services: +263 67 22203-5',
      'HIV Testing & Counseling',
      'STI Prevention Resources',
    ],
  },
  'family-home': {
    id: 'family-home',
    name: 'Family & Home Challenges',
    description: 'Family health issues, home challenges, and family-related stress',
    icon: 'home-outline',
    color: '#F97316',
    resources: [
      'CUT Counseling Services: +263 67 22203-5 Ext. 1297',
      'Family Support Resources',
      'Peer Support Groups',
    ],
  },
  'academic': {
    id: 'academic',
    name: 'Academic Support & Exam Stress',
    description: 'Study stress, exam anxiety, performance, and academic challenges',
    icon: 'school-outline',
    color: Colors.light.primary, // Indigo
    resources: [
      'CUT Academic Support',
      'Study Skills Workshops',
      'Tutoring Services',
      'Exam Stress Management',
    ],
  },
  'relationships': {
    id: 'relationships',
    name: 'Relationship & Social Guidance',
    description: 'Dating, friendships, and interpersonal challenges',
    icon: 'people-outline',
    color: Colors.light.secondary,
    resources: [
      'Relationship Counseling',
      'Peer Support Groups',
      'CUT Counseling Services',
    ],
  },
  'general': {
    id: 'general',
    name: 'General Support',
    description: 'General peer support and campus life discussions',
    icon: 'chatbubbles-outline',
    color: Colors.light.primary,
    resources: [
      'CUT Student Affairs',
      'Peer Educator Club',
    ],
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);
