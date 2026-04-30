import { z } from 'zod';
import DOMPurify from 'dompurify';

/**
 * Sanitizes input to prevent XSS.
 */
export const sanitizeInput = (input: string): string => {
    if (typeof window !== 'undefined') {
        return DOMPurify.sanitize(input);
    }
    return input;
};

/**
 * Zod schema for basic string input sanitization and validation.
 */
export const baseInputSchema = z.string()
    .min(1, "Campo obrigatório")
    .max(30000, "Limite de caracteres excedido")
    .transform(sanitizeInput);

/**
 * Helper to safely validate an input.
 */
export const validateInput = (schema: z.ZodSchema, data: unknown) => {
    return schema.safeParse(data);
};
