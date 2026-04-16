export interface OptionItem {
  label: string;
  value: number;
}

const toLabelMap = (options: OptionItem[]) =>
  options.reduce<Record<number, string>>((labels, option) => {
    labels[option.value] = option.label;
    return labels;
  }, {});

export const GENDER_OPTIONS: OptionItem[] = [
  { label: 'Male', value: 1 },
  { label: 'Female', value: 2 }
];

export const GOAL_TYPE_OPTIONS: OptionItem[] = [
  { label: 'Endurance gain', value: 1 },
  { label: 'Muscle gain', value: 2 },
  { label: 'Strength gain', value: 3 },
  { label: 'Weight gain', value: 4 },
  { label: 'Weight loss', value: 5 },
  { label: 'Stretching', value: 6 }
];

export const MUSCLE_GROUP_OPTIONS: OptionItem[] = [
  { label: 'Abdomen', value: 1 },
  { label: 'Arms', value: 2 },
  { label: 'Back', value: 3 },
  { label: 'Chest', value: 4 },
  { label: 'Legs', value: 5 },
  { label: 'Shoulders', value: 6 }
];

export const DIFFICULTY_OPTIONS: OptionItem[] = [
  { label: 'Beginner', value: 1 },
  { label: 'Intermediate', value: 2 },
  { label: 'Advanced', value: 3 }
];

export const FOOD_CATEGORY_OPTIONS: OptionItem[] = [
  { label: 'Protein', value: 1 },
  { label: 'Carbohydrate', value: 2 },
  { label: 'Fat', value: 3 },
  { label: 'Dairy', value: 4 },
  { label: 'Fruit', value: 5 },
  { label: 'Vegetable', value: 6 },
  { label: 'Grain', value: 7 },
  { label: 'Snack', value: 8 },
  { label: 'Beverage', value: 9 },
  { label: 'Supplement', value: 10 }
];

export const FOOD_BRAND_OPTIONS: OptionItem[] = [
  { label: 'Generic', value: 1 },
  { label: 'Homemade', value: 2 },
  { label: 'MyProtein', value: 3 },
  { label: 'BestNutrition', value: 4 },
  { label: 'Bulk', value: 5 },
  { label: 'Lidl', value: 6 },
  { label: 'Kaufland', value: 7 }
];

export const GENDER_LABELS = toLabelMap(GENDER_OPTIONS);
export const GOAL_TYPE_LABELS = toLabelMap(GOAL_TYPE_OPTIONS);
export const MUSCLE_GROUP_LABELS = toLabelMap(MUSCLE_GROUP_OPTIONS);
export const DIFFICULTY_LABELS = toLabelMap(DIFFICULTY_OPTIONS);
export const FOOD_CATEGORY_LABELS = toLabelMap(FOOD_CATEGORY_OPTIONS);
export const FOOD_BRAND_LABELS = toLabelMap(FOOD_BRAND_OPTIONS);

export const NAVIGATION_ITEMS = [
  { label: 'Dashboard', route: '/dashboard', icon: 'pi pi-home' },
  { label: 'Workouts', route: '/workouts', icon: 'pi pi-bolt' },
  { label: 'Goals', route: '/goals', icon: 'pi pi-flag' },
  { label: 'Progress', route: '/progress', icon: 'pi pi-chart-line' },
  { label: 'Nutrition', route: '/nutrition', icon: 'pi pi-apple' },
  { label: 'Profile', route: '/profile', icon: 'pi pi-user' }
];
