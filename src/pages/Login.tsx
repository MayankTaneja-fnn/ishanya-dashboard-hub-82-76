
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/components/ui/LanguageProvider';
import { authenticateUser } from '@/lib/auth';

// Form schema definition for validation
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  role: z.string().default('administrator'),
});

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<string>('administrator');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: selectedRole
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const result = await authenticateUser(data.email, data.password, data.role);
      
      if (result.success && result.user) {
        toast({
          title: t("login.success") || "Login successful!",
          description: t("login.redirecting") || "Redirecting to dashboard...",
        });
        
        // Redirect based on user role
        switch (result.user.role) {
          case 'administrator':
            navigate('/admin');
            break;
          case 'hr':
            navigate('/hr');
            break;
          case 'teacher':
            navigate('/teacher');
            break;
          case 'parent':
            navigate('/parent');
            break;
          default:
            navigate('/');
            break;
        }
      } else {
        toast({
          variant: "destructive",
          title: t("login.error") || "Login failed.",
          description: result.message || (t("login.invalid_credentials") || "Invalid email or password."),
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("login.error") || "Login failed.",
        description: t("login.try_again") || "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle role selection change
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 h-screen">
      <div className="hidden lg:block">
        <img
          src="/lovable-uploads/17953c8a-6715-4e58-af68-a3918c44fd33.png"
          alt="Ishanya Foundation"
          className="h-32 w-auto mx-auto mb-6" 
        />
        <h1 className="text-2xl font-semibold text-center mb-2 text-ishanya-green">
          {t('login.welcome') || 'Ishanya Foundation Portal'}
        </h1>
        <p className="text-gray-500 text-center mb-8">{t('login.subtitle') || 'Login to access the dashboard'}</p>
        <img
          src="/lovable-uploads/4ce1be7f-1512-4ad9-898d-8e265d612982.png"
          alt="Login Banner"
          className="object-cover w-full h-full"
        />
      </div>

      <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md p-4 sm:p-8 rounded-lg shadow-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center font-bold">{t('login.title') || 'Login'}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t('login.email') || 'Email'}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('login.email_placeholder') || "Enter your email"}
                  aria-invalid={errors.email ? true : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email?.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">{t('login.password') || 'Password'}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('login.password_placeholder') || "Enter your password"}
                  aria-invalid={errors.password ? true : undefined}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password?.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">{t('login.role') || 'Login As'}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    type="button"
                    variant={selectedRole === 'administrator' ? 'default' : 'outline'}
                    className={selectedRole === 'administrator' ? 'bg-ishanya-green hover:bg-ishanya-green/90' : ''}
                    onClick={() => handleRoleChange('administrator')}
                  >
                    {t('login.role_admin') || 'Administrator'}
                  </Button>
                  <Button 
                    type="button"
                    variant={selectedRole === 'hr' ? 'default' : 'outline'}
                    className={selectedRole === 'hr' ? 'bg-ishanya-green hover:bg-ishanya-green/90' : ''}
                    onClick={() => handleRoleChange('hr')}
                  >
                    {t('login.role_hr') || 'HR'}
                  </Button>
                  <Button 
                    type="button"
                    variant={selectedRole === 'teacher' ? 'default' : 'outline'}
                    className={selectedRole === 'teacher' ? 'bg-ishanya-green hover:bg-ishanya-green/90' : ''}
                    onClick={() => handleRoleChange('teacher')}
                  >
                    {t('login.role_teacher') || 'Teacher'}
                  </Button>
                  <Button 
                    type="button"
                    variant={selectedRole === 'parent' ? 'default' : 'outline'}
                    className={selectedRole === 'parent' ? 'bg-ishanya-green hover:bg-ishanya-green/90' : ''}
                    onClick={() => handleRoleChange('parent')}
                  >
                    {t('login.role_parent') || 'Parent'}
                  </Button>
                </div>
                <Input 
                  type="hidden" 
                  {...register("role")} 
                  value={selectedRole}
                />
              </div>
              
              <Button disabled={isLoading} className="w-full bg-ishanya-green hover:bg-ishanya-green/90 text-white">
                {isLoading ? (t('login.logging_in') || "Logging in...") : (t('login.button') || "Login")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
