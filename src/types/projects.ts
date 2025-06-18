
export interface Project {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  progress: number;
  createdDate: Date;
  dueDate: Date;
  originalDueDate?: Date;
  completedDate?: Date;
  isMoved?: boolean;
  isDeleted?: boolean;
  deletedDate?: Date;
}
