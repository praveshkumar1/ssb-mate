import User from '../models/User';
import { logger } from '../utils/logger';

export class CoachServiceNew {
  // Get all verified coaches
  static async getVerifiedCoaches() {
    try {
      return await User.find({
        role: 'mentor',
        isVerified: true,
        isActive: true
      }).select('-password').sort({ rating: -1 });
    } catch (error) {
      logger.error('Error getting verified coaches:', error);
      throw new Error('Failed to fetch verified coaches');
    }
  }

  // Search coaches by various criteria
  static async searchCoaches(searchParams: {
    specialization?: string;
    minRating?: number;
    location?: string;
    experience?: string;
    query?: string;
  }) {
    try {
      const filter: any = {
        role: 'mentor',
        isActive: true
      };

      if (searchParams.specialization) {
        filter.specializations = { $in: [searchParams.specialization] };
      }

      if (searchParams.minRating) {
        filter.rating = { $gte: searchParams.minRating };
      }

      if (searchParams.location) {
        filter.location = { $regex: searchParams.location, $options: 'i' };
      }

      if (searchParams.experience) {
        filter.experience = searchParams.experience;
      }

      if (searchParams.query) {
        filter.$or = [
          { name: { $regex: searchParams.query, $options: 'i' } },
          { bio: { $regex: searchParams.query, $options: 'i' } },
          { specializations: { $in: [new RegExp(searchParams.query, 'i')] } }
        ];
      }

      return await User.find(filter)
        .select('-password')
        .sort({ isVerified: -1, rating: -1 });
    } catch (error) {
      logger.error('Error searching coaches:', error);
      throw new Error('Failed to search coaches');
    }
  }

  // Get coach by ID
  static async getCoachById(id: string) {
    try {
      const coach = await User.findOne({
        _id: id,
        role: 'mentor',
        isActive: true
      }).select('-password');

      if (!coach) {
        throw new Error('Coach not found');
      }

      return coach;
    } catch (error) {
      logger.error('Error getting coach by ID:', error);
      throw error;
    }
  }

  // Get top rated coaches
  static async getTopRatedCoaches(limit: number = 10) {
    try {
      return await User.find({
        role: 'mentor',
        isActive: true,
        rating: { $gte: 4.0 }
      })
        .select('-password')
        .sort({ rating: -1 })
        .limit(limit);
    } catch (error) {
      logger.error('Error getting top rated coaches:', error);
      throw new Error('Failed to fetch top rated coaches');
    }
  }
}
