// Let's add a helper function to ensure all tasks have a created_at field
export const ensureTasksHaveCreatedAt = (tasks: any[]): any[] => {
  return tasks.map(task => ({
    ...task,
    created_at: task.created_at || new Date().toISOString()
  }));
};
