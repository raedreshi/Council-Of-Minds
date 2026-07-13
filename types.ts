/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PanelCategory {
  MARKET = "The Market & Labor Panel",
  STATE = "The State & Sovereignty Panel",
  SCIENCE = "The Science & Ethics Panel",
  ACTIVISM = "The Resistance & Activism Panel",
  MIND = "The Mind & Culture Panel",
  CUSTOM = "The Custom Council Chamber"
}

export interface Thinker {
  id: string;
  name: string;
  title: string;
  era: string;
  philosophy: string;
  avatarEmoji: string;
  color: string; // Tailwind text color class, e.g., 'text-amber-500'
  bgGradient: string; // Tailwind gradient, e.g., 'from-amber-950/40 to-yellow-950/20'
  accentBorder: string; // Tailwind border color class
  quote: string;
  summary: string;
}

export interface Dilemma {
  id: string;
  title: string;
  description: string;
  category: PanelCategory;
  thinkerAId: string;
  thinkerBId: string;
}

export interface DebateSpeech {
  thinkerId: string;
  content: string;
}

export interface Debate {
  id: string;
  title: string;
  category: PanelCategory;
  thinkerAId: string;
  thinkerBId: string;
  speechA: string;
  speechB: string;
  counterA: string; // Thinker A's counter to B
  counterB: string; // Thinker B's counter to A
  isCustom?: boolean;
}
