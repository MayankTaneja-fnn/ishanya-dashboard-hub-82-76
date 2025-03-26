
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Task, fetchTasksFromRPC, updateTaskViaRPC, createTaskViaRPC } from '@/lib/api';
import { toast } from 'sonner';

interface StudentData {
  id: string;
  student_id: number;
  first_name: string;
  last_name: string;
  gender: string;
  dob: string;
  enrollment_year: number;
  status: string;
  student_email: string;
  program_id: number;
  contact_number: string;
  center_id: number;
  [key: string]: any;
}

const StudentDetails = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState<Date | undefined>(undefined);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    if (studentId) {
      fetchStudent();
      fetchTasks();
    }
  }, [studentId]);

  const fetchStudent = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('Error fetching student:', error);
    } else {
      setStudent(data);
    }
  };

  const fetchTasks = async () => {
    if (!studentId) return;
    
    try {
      setTasksLoading(true);
      
      // Use the RPC function instead of direct table access
      const tasksData = await fetchTasksFromRPC(studentId);
      
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load student tasks');
    } finally {
      setTasksLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !newTaskDescription || !newTaskDueDate) return;
    
    try {
      setTasksLoading(true);
      setIsAddingTask(true);
      
      // Use RPC function instead of direct table access
      const success = await createTaskViaRPC({
        student_id: parseInt(studentId),
        description: newTaskDescription,
        due_date: newTaskDueDate.toISOString(),
        completed: false
      });
      
      if (!success) {
        throw new Error('Failed to add task');
      }
      
      setNewTaskDescription('');
      setNewTaskDueDate(undefined);
      fetchTasks();
      toast.success('Task added successfully');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setTasksLoading(false);
      setIsAddingTask(false);
    }
  };

  const toggleTaskCompletion = async (taskId: number, completed: boolean) => {
    try {
      setTasksLoading(true);
      
      // Use RPC function instead of direct table access
      const success = await updateTaskViaRPC(taskId, !completed);
      
      if (!success) {
        throw new Error('Failed to update task');
      }
      
      fetchTasks();
      toast.success(completed ? 'Task marked as incomplete' : 'Task marked as complete');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setTasksLoading(false);
    }
  };

  if (!student) {
    return (
      <Layout title="Student Details">
        <div>Loading student details...</div>
      </Layout>
    );
  }

  return (
    <Layout title={`Student Details - ${student.first_name} ${student.last_name}`}>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Student: {student.first_name} {student.last_name}</h2>
        <p>Email: {student.student_email}</p>
        <p>Date of Birth: {student.dob}</p>

        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Tasks:</h3>
          <ul>
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                <div>
                  <span className={task.completed ? 'line-through text-gray-500' : ''}>
                    {task.description} (Due: {new Date(task.due_date).toLocaleDateString()})
                  </span>
                </div>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleTaskCompletion(task.id, task.completed)}
                  >
                    {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Add New Task:</h3>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="taskDescription">Description:</Label>
              <Input
                type="text"
                id="taskDescription"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Due Date:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !newTaskDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTaskDueDate ? (
                      format(newTaskDueDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center" side="bottom">
                  <Calendar
                    mode="single"
                    selected={newTaskDueDate}
                    onSelect={setNewTaskDueDate}
                    disabled={(date) =>
                      date < new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleAddTask} disabled={isAddingTask}>
              {isAddingTask ? 'Adding Task...' : 'Add Task'}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDetails;
