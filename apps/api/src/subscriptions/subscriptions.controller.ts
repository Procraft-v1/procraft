import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CurrentUser, JwtAuthGuard, ReqUser } from '../auth/jwt-auth.guard';
import { toDateTimeOffsetString } from '../common/dates';
import { SubscriptionEntity } from '../database/entities';

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

/** Port of SubscriptionsController + GetMySubscriptionQueryHandler. */
@Controller('api/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get('me')
  async getMe(@ReqUser() current: CurrentUser) {
    const subscription = await this.dataSource.getRepository(SubscriptionEntity).findOne({
      where: { userId: current.userId },
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      const now = new Date();
      return {
        id: EMPTY_GUID,
        userId: current.userId,
        planKey: 'trial',
        status: 'Trial',
        currentPeriodEnd: toDateTimeOffsetString(new Date(now.getTime() + 30 * 86_400_000)),
        createdAt: toDateTimeOffsetString(now),
      };
    }

    return {
      id: subscription.id,
      userId: subscription.userId,
      planKey: subscription.planKey,
      status: subscription.status,
      currentPeriodEnd: toDateTimeOffsetString(subscription.currentPeriodEnd),
      createdAt: toDateTimeOffsetString(subscription.createdAt),
    };
  }
}
