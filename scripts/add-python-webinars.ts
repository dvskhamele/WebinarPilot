#!/usr/bin/env tsx

// Quick script to add Python and Django webinars to storage for immediate search results

import { MemStorage, SupabaseStorage } from '../server/storage';
import { type InsertWebinar } from '@shared/types';

const pythonWebinars: InsertWebinar[] = [
  {
    id: 'python-fundamentals-aug-25',
    title: 'Free Python Programming Fundamentals Workshop',
    host: 'Python Academy India',
    dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&h=400&fit=crop',
    meetUrl: 'https://meet.google.com/python-fundamentals',
    subtitle: 'Master Python basics with hands-on coding exercises and real-world projects',
    trainerName: 'Arjun Sharma',
    trainerTitle: 'Senior Python Developer',
    trainerBio: 'Expert Python developer with 8+ years experience building scalable applications',
    trainerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  },
  {
    id: 'django-rest-api-aug-27',
    title: 'Django REST API Development Masterclass - Free Workshop',
    host: 'Django Developers Community',
    dateTime: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop',
    meetUrl: 'https://meet.google.com/django-rest-api',
    subtitle: 'Build professional REST APIs with Django REST Framework from scratch',
    trainerName: 'Priya Patel',
    trainerTitle: 'Django Expert & Full Stack Developer',
    trainerBio: 'Full-stack developer specializing in Django and Python web development for 6+ years',
    trainerImage: 'https://images.unsplash.com/photo-1494790108755-2616b332c3db?w=400&h=400&fit=crop'
  },
  {
    id: 'python-data-science-aug-30',
    title: 'Python for Data Science: Complete Beginner Guide - Free Webinar',
    host: 'Data Science Institute',
    dateTime: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), // 12 days from now
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    meetUrl: 'https://meet.google.com/python-data-science',
    subtitle: 'Learn Python libraries like Pandas, NumPy, and Matplotlib for data analysis',
    trainerName: 'Dr. Rakesh Kumar',
    trainerTitle: 'Data Science Lead',
    trainerBio: 'PhD in Computer Science with expertise in machine learning and data analytics',
    trainerImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop'
  },
  {
    id: 'django-ecommerce-sept-02',
    title: 'Build E-commerce Site with Django - Free Workshop Series',
    host: 'E-commerce Developers Hub',
    dateTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    category: 'Technology', 
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    meetUrl: 'https://meet.google.com/django-ecommerce',
    subtitle: 'Create a complete e-commerce platform using Django, payments, and deployment',
    trainerName: 'Vikash Singh',
    trainerTitle: 'Senior Django Developer',
    trainerBio: 'E-commerce specialist with 10+ years building scalable online platforms',
    trainerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'
  },
  {
    id: 'python-automation-sept-05',
    title: 'Python Automation & Scripting for Professionals - Free Training',
    host: 'Automation Academy',
    dateTime: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), // 18 days from now
    category: 'Technology',
    image: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=600&h=400&fit=crop',
    meetUrl: 'https://meet.google.com/python-automation',
    subtitle: 'Automate repetitive tasks, web scraping, and file processing with Python',
    trainerName: 'Sneha Reddy',
    trainerTitle: 'Python Automation Expert',
    trainerBio: 'Automation specialist helping companies save hundreds of hours with Python scripts',
    trainerImage: 'https://images.unsplash.com/photo-1494790108755-2616b332c3db?w=400&h=400&fit=crop'
  }
];

async function addPythonWebinars() {
  console.log('Adding Python and Django webinars to storage...');
  
  try {
    // Use MemStorage since it's the current implementation
    const { storage } = await import('../server/index');
    
    for (const webinar of pythonWebinars) {
      await storage.createWebinar(webinar);
      console.log(`✅ Added: ${webinar.title}`);
    }
    
    console.log(`\n🎉 Successfully added ${pythonWebinars.length} Python/Django webinars!`);
    console.log('You can now search for "python" or "django" to see results.');
    
  } catch (error) {
    console.error('❌ Error adding webinars:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  addPythonWebinars().then(() => process.exit(0));
}

export { pythonWebinars, addPythonWebinars };