import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateRatingDto } from './dto/create-rating.dto';
import type { TripsHistoryQueryDto } from './dto/trips-history-query.dto';

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRating(raterId: string, dto: CreateRatingDto) {
    if (raterId === dto.ratedUserId) {
      throw new BadRequestException('You cannot rate yourself');
    }

    const ratedUser = await this.prisma.users.findUnique({
      where: { id: dto.ratedUserId },
    });
    if (!ratedUser) {
      throw new NotFoundException('Rated user not found');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const rating = await tx.ratings.create({
          data: {
            tripId: dto.tripId,
            raterId,
            ratedUserId: dto.ratedUserId,
            role: dto.role,
            stars: dto.stars,
            comment: dto.comment,
          },
        });

        const { _avg } = await tx.ratings.aggregate({
          where: { ratedUserId: dto.ratedUserId },
          _avg: { stars: true },
        });

        const profile = await tx.profiles.findUnique({
          where: { userId: dto.ratedUserId },
        });
        if (profile && _avg.stars !== null) {
          await tx.profiles.update({
            where: { userId: dto.ratedUserId },
            data: { rate: _avg.stars },
          });
        }

        return rating;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('You have already rated this trip');
      }
      throw error;
    }
  }

  async getTripsHistory(userId: string, query: TripsHistoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.RatingsWhereInput = {
      ratedUserId: userId,
      ...(query.role && { role: query.role }),
      ...((query.fromDate || query.toDate) && {
        createdAt: {
          ...(query.fromDate && { gte: new Date(query.fromDate) }),
          ...(query.toDate && { lte: new Date(query.toDate) }),
        },
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.ratings.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          tripId: true,
          role: true,
          stars: true,
          comment: true,
          createdAt: true,
          rater: { select: { id: true, name: true } },
        },
      }),
      this.prisma.ratings.count({ where }),
    ]);

    return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}
