// Database enum values for habit categories
export const DATABASE_CATEGORIES = [
  'health',
  'mental',
  'personal',
  'productivity',
  'relationship',
  'social', 
  'spiritual',
  'wealth',
  // Keep old categories for backward compatibility
  'fitness',
  'learning',
  'other'
] as const;

// User-friendly display names for categories
export const CATEGORY_DISPLAY_MAP = {
  health: 'Health',
  mental: 'Mental',
  personal: 'Personal',
  productivity: 'Productivity', 
  relationship: 'Relationship',
  social: 'Social',
  spiritual: 'Spiritual',
  wealth: 'Wealth',
  // Backward compatibility
  fitness: 'Fitness',
  learning: 'Learning',
  other: 'Other'
} as const;

// Reverse mapping for display to database (only show new categories to users)
export const DISPLAY_TO_DATABASE_MAP = {
  'No category': undefined,
  'Health': 'health',
  'Mental': 'mental',
  'Personal': 'personal',
  'Productivity': 'productivity',
  'Relationship': 'relationship',
  'Social': 'social',
  'Spiritual': 'spiritual',
  'Wealth': 'wealth'
} as const;

export type DatabaseCategory = typeof DATABASE_CATEGORIES[number];
export type DisplayCategory = keyof typeof DISPLAY_TO_DATABASE_MAP;

// Get display-friendly category options for select components
export const getCategoryOptions = (): DisplayCategory[] => {
  return Object.keys(DISPLAY_TO_DATABASE_MAP) as DisplayCategory[];
};

// Map display category to database value
export const mapDisplayToDatabase = (displayCategory: string | undefined): string | undefined => {
  if (!displayCategory || displayCategory === 'none') return undefined;
  return DISPLAY_TO_DATABASE_MAP[displayCategory as DisplayCategory] || 'other';
};

// Map database category to display value
export const mapDatabaseToDisplay = (databaseCategory: string | undefined): string => {
  if (!databaseCategory) return '';
  return CATEGORY_DISPLAY_MAP[databaseCategory as DatabaseCategory] || 'Other';
};