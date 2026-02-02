
export type DishCategory = 'Entrante' | 'Principal' | 'Postre' | 'Vino';

export interface ReviewDimensions {
  flavor: number;
  texture: number;
  creativity: number;
  service: number;
  acoustics: number;
  lighting: number;
  quality: number;
  value: number;
}

export interface Dish {
  id: string;
  name: string;
  category: DishCategory;
  score: number; // 0-10
  notes: string;
}

export interface Restaurant {
  id: string;
  name: string;
  date: string;
  location: string;
  tags: string[];
  review: ReviewDimensions;
  dishes: Dish[];
  averageScore: number;
}
