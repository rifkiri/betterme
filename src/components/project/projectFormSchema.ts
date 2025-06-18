
import * as z from 'zod';

export const projectFormSchema = z.object({
  title: z.string().min(1, 'Project title is required'),
  description: z.string().optional(),
  progress: z.number().min(0).max(100),
  dueDate: z.date()
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
