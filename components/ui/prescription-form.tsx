"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { prescriptionsAPI, type Prescription } from "@/lib/api";
import { useEffect } from "react";
// 1. Define the Zod schema for validation
const formSchema = z.object({
  medicationName: z.string().min(2, {
    message: "Medication name must be at least 2 characters.",
  }),
  dosage: z.string().min(1, {
    message: "Dosage is required.",
  }),
  frequency: z.string().min(1, {
    message: "Frequency is required.",
  }),
  instructions: z.string().optional(),
  // CHANGE THIS LINE:
  appointmentId: z.string(), // Changed from z.string().uuid() to z.string()
});

interface PrescriptionFormProps {
  appointmentId: string;
  onPrescriptionAdded: (prescription: Prescription) => void;
  onClose: () => void;
}

export function PrescriptionForm({
  appointmentId,
  onPrescriptionAdded,
  onClose,
}: PrescriptionFormProps) {
  const { toast } = useToast();

  // 2. Initialize the form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicationName: "",
      dosage: "",
      frequency: "",
      instructions: "",
      appointmentId: appointmentId,
    },
  });

  // 3. Define the submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const newPrescription = await prescriptionsAPI.create(values);

      onPrescriptionAdded(newPrescription);
      toast({
        title: "Prescription Created",
        description: `A new prescription for ${values.medicationName} has been added.`,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create prescription:", error);
      let errorMessage = "Failed to create the prescription. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="medicationName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medication Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Ibuprofen" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dosage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dosage</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 200mg" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Twice daily" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional instructions for the patient..."
                  {...field}
                  className="text-gray-900 dark:text-gray-50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Write Prescription
        </Button>
      </form>
    </Form>
  );
}
