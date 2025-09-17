import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { logger } from '../utils/logger';

export const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    
    // Create sample users
    const saltRounds = 12;
    
    const sampleUsers = [
      {
        email: 'john.doe@example.com',
        password: await bcrypt.hash('password123', saltRounds),
        firstName: 'John',
        lastName: 'Doe',
        role: 'mentor',
        phoneNumber: '+1-555-0123',
        isActive: true,
        isVerified: true,
        bio: 'Experienced SSB coach with 10+ years of training aspiring officers.',
        experience: 10,
        specializations: ['Interview Techniques', 'Leadership', 'Group Discussions'],
        rank: 'Colonel',
        unit: 'Indian Army',
        achievements: ['Best Trainer Award 2020', 'SSB Expert Certification'],
        hourlyRate: 2500,
        location: 'New Delhi, India',
        rating: 4.8,
        totalReviews: 24,
        certifications: ['SSB Expert', 'Leadership Coach'],
        sportsPlayed: ['Cricket', 'Football']
      },
      {
        email: 'sarah.smith@example.com',
        password: await bcrypt.hash('password123', saltRounds),
        firstName: 'Sarah',
        lastName: 'Smith',
        role: 'mentor',
        isActive: true,
        isVerified: true,
        bio: 'Former SSB Interviewing Officer specializing in psychology and personality assessment.',
        experience: 8,
        specializations: ['Psychology', 'Personality Assessment', 'Individual Obstacles'],
        rank: 'Major',
        unit: 'Indian Air Force',
        achievements: ['Psychology Excellence Award', 'Officer Training Expert'],
        hourlyRate: 2200,
        location: 'Bangalore, India',
        rating: 4.9,
        totalReviews: 18,
        certifications: ['Psychology Certified', 'SSB Interviewing Officer'],
        sportsPlayed: ['Tennis', 'Badminton']
      },
      {
        email: 'mike.johnson@example.com',
        password: await bcrypt.hash('password123', saltRounds),
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'mentor',
        isActive: true,
        isVerified: true,
        bio: 'SSB preparation expert focusing on group tasks and command exercises.',
        experience: 12,
        specializations: ['Group Planning Exercise', 'Command Tasks', 'Progressive Group Tasks'],
        rank: 'Lieutenant Colonel',
        unit: 'Indian Navy',
        achievements: ['Outstanding Service Medal', 'Training Excellence Award'],
        hourlyRate: 2800,
        location: 'Mumbai, India',
        rating: 4.7,
        totalReviews: 31,
        certifications: ['SSB Training Expert', 'Leadership Development'],
        sportsPlayed: ['Swimming', 'Basketball']
      },
      {
        email: 'priya.sharma@example.com',
        password: await bcrypt.hash('password123', saltRounds),
        firstName: 'Priya',
        lastName: 'Sharma',
        role: 'mentor',
        isActive: true,
        isVerified: true,
        bio: 'Specialized in personal interview preparation and communication skills.',
        experience: 6,
        specializations: ['Personal Interview', 'Communication Skills', 'Conference Procedure'],
        rank: 'Captain',
        unit: 'Indian Army',
        achievements: ['Communication Excellence Award', 'Best Interview Coach 2021'],
        hourlyRate: 2000,
        location: 'Pune, India',
        rating: 4.6,
        totalReviews: 15,
        certifications: ['Communication Expert', 'Interview Specialist'],
        sportsPlayed: ['Volleyball', 'Athletics']
      },
      {
        email: 'mentee@example.com',
        password: await bcrypt.hash('password123', saltRounds),
        firstName: 'Test',
        lastName: 'Mentee',
        role: 'mentee',
        isActive: true,
        isVerified: true,
        bio: 'Aspiring to join the Indian Armed Forces.',
        location: 'Chennai, India'
      }
    ];
    
    await User.insertMany(sampleUsers);
    logger.info(`✅ Seeded ${sampleUsers.length} users successfully`);
    
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  }
};
