
import * as z from 'zod';

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['High', 'Medium', 'Low']),
  estimatedTime: z.string().optional(),
  dueDate: z.date().optional(),
  weeklyOutputId: z.string().optional()
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
