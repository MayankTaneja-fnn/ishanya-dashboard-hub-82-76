
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ensureTasksHaveCreatedAt, Task } from '@/lib/api';

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
    // Check if studentId exists and is valid
    if (!studentId) {
      console.error('No student ID provided');
      return;
    }

    try {
      // Use a custom query to get tasks related to this student
      // This is a workaround if student_tasks isn't in the database schema
      const { data: tasksData, error: tasksError } = await supabase
        .rpc('get_student_tasks', { student_id_param: parseInt(studentId) });

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        setTasks([]);
      } else if (tasksData) {
        setTasks(ensureTasksHaveCreatedAt(tasksData));
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Exception in fetchTasks:', error);
      setTasks([]);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskDescription || !newTaskDueDate) {
      alert('Please enter a description and due date for the task.');
      return;
    }

    setIsAddingTask(true);

    try {
      // Use a custom RPC function to add a task for this student
      const { data, error } = await supabase
        .rpc('add_student_task', {
          student_id_param: parseInt(studentId!),
          description_param: newTaskDescription,
          due_date_param: newTaskDueDate.toISOString(),
          completed_param: false
        });

      if (error) {
        console.error('Error adding task:', error);
        alert('Failed to add task.');
      } else {
        // Refresh tasks after adding
        await fetchTasks();
        setNewTaskDescription('');
        setNewTaskDueDate(undefined);
        alert('Task added successfully!');
      }
    } catch (error) {
      console.error('Exception in handleAddTask:', error);
      alert('An unexpected error occurred.');
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleTaskCompletion = async (taskId: number, completed: boolean) => {
    try {
      // Use a custom RPC function to update task completion status
      const { error } = await supabase
        .rpc('update_task_completion', {
          task_id_param: taskId,
          completed_param: !completed
        });

      if (error) {
        console.error('Error updating task:', error);
        alert('Failed to update task.');
      } else {
        // Update the local state
        setTasks(
          tasks.map((task) =>
            task.id === taskId ? { ...task, completed: !completed } : task
          )
        );
      }
    } catch (error) {
      console.error('Exception in handleTaskCompletion:', error);
      alert('An unexpected error occurred.');
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
                    onClick={() => handleTaskCompletion(task.id, task.completed)}
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
