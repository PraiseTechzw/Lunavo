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
    icon: 'medical-outline',
    color: Colors.light.mentalHealth,
    resources: [
      'CUT Counseling Services: +263 67 22203-5 Ext. 1297',
      'Zimbabwe Lifeline: +263 4 700 800',
      'Mental Health Helpline: +263 4 700 800',
    ],
  },
  crisis: {
    id: 'crisis',
    name: 'Crisis Support',
    description: 'Immediate help for suicidal thoughts or emotional crises',
    icon: 'warning',
    color: Colors.light.crisis,
    resources: [
      'Emergency: 999',
      'Police: 995',
      'CUT Emergency: +263 67 22203-5',
    ],
  },
  'substance-abuse': {
    id: 'substance-abuse',
    name: 'Drug & Substance Abuse',
    description: 'Support for drug and alcohol related concerns, addiction recovery',
    icon: 'medkit',
    color: Colors.light.substance,
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
    icon: 'heart',
    color: Colors.light.health,
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
    icon: 'heart-circle',
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
  academic: {
    id: 'academic',
    name: 'Academic Support & Exam Stress',
    description: 'Study stress, exam anxiety, performance, and academic challenges',
    icon: 'library-outline',
    color: Colors.light.academic,
    resources: [
      'CUT Academic Support',
      'Study Skills Workshops',
      'Tutoring Services',
      'Exam Stress Management',
    ],
  },
  social: {
    id: 'social',
    name: 'Social & Personal',
    description: 'Friendship, social anxiety, and personal growth',
    icon: 'people',
    color: Colors.light.social,
    resources: [
      'Student Clubs',
      'Social Skills Workshops',
      'Peer Support Groups',
    ],
  },
  relationships: {
    id: 'relationships',
    name: 'Relationship & Social Guidance',
    description: 'Dating, friendships, and interpersonal challenges',
    icon: 'heart-circle',
    color: Colors.light.secondary,
    resources: [
      'Relationship Counseling',
      'Peer Support Groups',
      'CUT Counseling Services',
    ],
  },
  campus: {
    id: 'campus',
    name: 'Campus Life',
    description: 'Campus resources, facilities, and student life',
    icon: 'school',
    color: Colors.light.info,
    resources: [
      'CUT Student Affairs: +263 67 22203-5',
      'Campus Services',
      'Student Resources',
    ],
  },
  general: {
    id: 'general',
    name: 'General Support',
    description: 'Other concerns and questions',
    icon: 'chatbubbles',
    color: Colors.light.icon,
    resources: [
      'CUT Student Affairs: +263 67 22203-5',
      'Peer Support Forum',
    ],
  },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

