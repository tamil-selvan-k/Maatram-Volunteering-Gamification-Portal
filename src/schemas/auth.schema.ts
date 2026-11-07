import { z } from 'zod'

export const loginSchema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  full_name:    z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:        z.string().email('Enter a valid email address'),
  password:     z.string().min(8, 'Password must be at least 8 characters'),
  phone:        z.string().regex(/^\+?[\d\s-]{10,15}$/, 'Enter a valid phone number').optional().or(z.literal('')),
  role:         z.enum(['student', 'alumni', 'supporter']),
  employer_org: z.string().max(100).optional().or(z.literal('')),
})

export const onboardingSchema = z.object({
  preferences: z.array(
    z.enum(['physical_event', 'physical_verification', 'school_visit', 'office_bg_work', 'telephone_verification', 'other_small_work'])
  ).min(1, 'Select at least one activity type'),
  skills:           z.string().optional(),
  consent_push:     z.boolean(),
  consent_email:    z.boolean(),
  consent_linkedin: z.boolean(),
})

export type LoginFormValues      = z.infer<typeof loginSchema>
export type SignupFormValues      = z.infer<typeof signupSchema>
export type OnboardingFormValues  = z.infer<typeof onboardingSchema>
