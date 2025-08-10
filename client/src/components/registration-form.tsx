import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  whatsappNumber: z.string().min(10, 'Valid WhatsApp number is required'),
});

const reminderSchema = z.object({
  email: z.string().email('Valid email is required'),
});

type RegistrationData = z.infer<typeof registrationSchema>;
type ReminderData = z.infer<typeof reminderSchema>;

interface RegistrationFormProps {
  webinarId: string;
  type: 'registration' | 'reminder';
  onSuccess?: (meetUrl?: string) => void;
}

export function RegistrationForm({ webinarId, type, onSuccess }: RegistrationFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const registrationForm = useForm<RegistrationData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      whatsappNumber: '',
    },
  });

  const reminderForm = useForm<ReminderData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      email: '',
    },
  });

  const form = type === 'registration' ? registrationForm : reminderForm;

  const mutation = useMutation({
    mutationFn: async (data: RegistrationData | ReminderData) => {
      const payload = {
        type,
        webinarId,
        ...data,
      };

      const response = await apiRequest('POST', '/api/webinar-action', payload);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: type === 'registration' ? 'Registration successful!' : 'Reminder set!',
        description: type === 'registration' 
          ? 'Opening webinar in new tab...' 
          : 'You will receive a reminder email.',
      });

      queryClient.invalidateQueries({ queryKey: ['/api/webinars', webinarId, 'registrations'] });

      if (type === 'registration' && data.meetUrl) {
        window.open(data.meetUrl, '_blank');
      }

      onSuccess?.(data.meetUrl);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to process request. Please try again.',
        variant: 'destructive',
      });
      console.error('Registration error:', error);
    },
  });

  const onSubmit = (data: RegistrationData | ReminderData) => {
    mutation.mutate(data);
  };

  if (type === 'registration') {
    return (
      <Form {...registrationForm}>
        <form onSubmit={registrationForm.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-registration">
          <FormField
            control={registrationForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={registrationForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" {...field} data-testid="input-email" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={registrationForm.control}
            name="whatsappNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp Number</FormLabel>
                <FormControl>
                  <Input type="tel" {...field} data-testid="input-whatsapp" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full py-3 text-base font-bold bg-green-500 hover:bg-green-600"
            disabled={mutation.isPending}
            data-testid="button-join-now"
          >
            {mutation.isPending ? 'Submitting...' : 'Join Now & Get Link'}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...reminderForm}>
      <form onSubmit={reminderForm.handleSubmit(onSubmit)} className="flex gap-2" data-testid="form-reminder">
        <FormField
          control={reminderForm.control}
          name="email"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...field}
                  data-testid="input-reminder-email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="outline"
          disabled={mutation.isPending}
          data-testid="button-set-reminder"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    </Form>
  );
}
