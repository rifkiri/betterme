import * as z from 'zod';

export const weeklyOutputFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.date().optional(),
  goalId: z.string().optional(),
  visibility: z.enum(['all', 'managers', 'self']).optional()
});

export type WeeklyOutputFormValues = z.infer<typeof weeklyOutputFormSchema>;