import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { FarmsModule } from "./farms/farms.module";
import { AnimalsModule } from "./animals/animals.module";
import { MilkModule } from "./milk/milk.module";
import { RedisModule } from "./redis/redis.module";
import { DatabaseModule } from "./database/database.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { HealthModule } from "./health-check/health.module";
import { HealthEventsModule } from "./health-events/health-events.module";
import { BreedingEventsModule } from "./breeding-events/breeding-events.module";
import { VaccinationsModule } from "./vaccinations/vaccinations.module";
import { InventoryItemsModule } from "./inventory-items/inventory-items.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Asynchronously configure ThrottlerModule to load configurations from environment variables
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          // Load TTL (time-to-live) and limit. Fall back to standard defaults if not provided.
          ttl: Number(config.get<number>("RATE_LIMIT_TTL") ?? 60000),
          limit: Number(config.get<number>("RATE_LIMIT_LIMIT") ?? 100),
        },
      ],
    }),
    DatabaseModule,
    NotificationsModule,
    HealthModule,
    RedisModule,
    AuthModule,
    FarmsModule,
    AnimalsModule,
    MilkModule,
    HealthEventsModule,
    BreedingEventsModule,
    VaccinationsModule,
    InventoryItemsModule,
  ],
  providers: [
    // Register the global ThrottlerGuard so all routes are rate-limited by default
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
