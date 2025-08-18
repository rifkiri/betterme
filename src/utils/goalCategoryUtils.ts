// Main categories for goals
export const GOAL_MAIN_CATEGORIES = ['personal', 'work'] as const;

// Sub-categories for personal goals (matching habit categories)
export const PERSONAL_SUBCATEGORIES = [
  'health',
  'mental', 
  'personal',
  'productivity',
  'relationship',
  'social',
  'spiritual',
  'wealth'
] as const;

// Sub-categories for work goals
export const WORK_SUBCATEGORIES = [
  'project',
  'sales', 
  'internal'
] as const;

// User-friendly display names for personal subcategories
export const PERSONAL_SUBCATEGORY_DISPLAY_MAP = {
  health: 'Health',
  mental: 'Mental',
  personal: 'Personal',
  productivity: 'Productivity',
  relationship: 'Relationship',
  social: 'Social',
  spiritual: 'Spiritual',
  wealth: 'Wealth'
} as const;

// User-friendly display names for work subcategories
export const WORK_SUBCATEGORY_DISPLAY_MAP = {
  project: 'Project',
  sales: 'Sales',
  internal: 'Internal'
} as const;

// Type definitions
export type GoalMainCategory = typeof GOAL_MAIN_CATEGORIES[number];
export type PersonalSubcategory = typeof PERSONAL_SUBCATEGORIES[number];
export type WorkSubcategory = typeof WORK_SUBCATEGORIES[number];
export type GoalSubcategory = PersonalSubcategory | WorkSubcategory;

// Get subcategory options based on main category
export const getSubcategoryOptions = (mainCategory: string): string[] => {
  if (mainCategory === 'personal') {
    return Object.keys(PERSONAL_SUBCATEGORY_DISPLAY_MAP);
  }
  if (mainCategory === 'work') {
    return Object.keys(WORK_SUBCATEGORY_DISPLAY_MAP);
  }
  return [];
};

// Map display subcategory to database value
export const mapSubcategoryDisplayToDatabase = (subcategory: string | undefined): string | undefined => {
  if (!subcategory || subcategory === 'No subcategory' || subcategory === 'none') return undefined;
  
  // Check personal subcategories
  const personalKey = Object.keys(PERSONAL_SUBCATEGORY_DISPLAY_MAP).find(
    key => PERSONAL_SUBCATEGORY_DISPLAY_MAP[key as PersonalSubcategory] === subcategory
  );
  if (personalKey) return personalKey;
  
  // Check work subcategories  
  const workKey = Object.keys(WORK_SUBCATEGORY_DISPLAY_MAP).find(
    key => WORK_SUBCATEGORY_DISPLAY_MAP[key as WorkSubcategory] === subcategory
  );
  if (workKey) return workKey;
  
  return subcategory.toLowerCase();
};

// Map database subcategory to display value
export const mapSubcategoryDatabaseToDisplay = (subcategory: string | undefined): string => {
  if (!subcategory) return 'No subcategory';
  
  // Check personal subcategories
  if (subcategory in PERSONAL_SUBCATEGORY_DISPLAY_MAP) {
    return PERSONAL_SUBCATEGORY_DISPLAY_MAP[subcategory as PersonalSubcategory];
  }
  
  // Check work subcategories
  if (subcategory in WORK_SUBCATEGORY_DISPLAY_MAP) {
    return WORK_SUBCATEGORY_DISPLAY_MAP[subcategory as WorkSubcategory];
  }
  
  // Capitalize first letter as fallback
  return subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
};