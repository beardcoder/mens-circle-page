import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const events = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/events' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.coerce.date(),
    endTime: z.coerce.date(),
    locationName: z.string(),
    addressNote: z.string().default('Die genaue Adresse erhältst du nach der Anmeldung.'),
    capacity: z.number().int().positive(),
    donationHint: z.string().default('Spendenbasis · Richtwert 20–35 €'),
    theme: z.string().optional(),
    status: z.enum(['open', 'closed', 'cancelled']).default('open'),
    registrationDeadline: z.coerce.date(),
    heroImage: image().optional(),
    excerpt: z.string(),
    agenda: z.array(z.string()).default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    author: z.string().default('Markus Sommer'),
    heroImage: image().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    order: z.number().default(0),
    category: z.string().optional(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({
    author: z.string(),
    context: z.string().optional(),
    order: z.number().default(0),
  }),
});

export const collections = { events, blog, faq, testimonials };
