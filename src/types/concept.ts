export type ConceptTier = 'budget-conscious' | 'creative-distinctive' | 'premium';

export interface ColorSwatch {
  name: string;
  hex: string;
}

export interface DecorConcept {
  focalPoint: string;
  lighting: string;
  tableSettings: string;
  botanicals: string;
}

export interface FoodAndBeverageConcept {
  serviceStyle: string;
  highlights: string[];
  signatureDrink: string;
}

export interface EntertainmentConcept {
  mainAct: string;
  interactiveElements: string[];
}

export interface GuestExperienceConcept {
  arrivalMoment: string;
  takeawayFavor: string;
  comfortFeatures: string[];
}

export interface CostEstimation {
  estimatedTotal: number;
  varianceFromBudget: number; // e.g. -5000 means $5,000 under budget
  percentOfBudget: number;
  disclaimer: string;
}

export interface TradeoffSummary {
  advantages: string[];
  compromises: string[];
}

export interface ThemeConcept {
  id: string;
  eventId: string;
  tier: ConceptTier;
  title: string;
  tagline: string;
  description: string;
  colorPalette: ColorSwatch[];
  decor: DecorConcept;
  foodAndBeverage: FoodAndBeverageConcept;
  entertainment: EntertainmentConcept;
  guestExperience: GuestExperienceConcept;
  costEstimation: CostEstimation;
  tradeoffs: TradeoffSummary;
}

