import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { FarmsModule } from "./farms/farms.module";
import { AnimalsModule } from "./animals/animals.module";
import { MilkModule } from "./milk/milk.module";
import { RedisModule } from "./redis/redis.module";
import { DatabaseModule } from "./database/database.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { HealthModule } from "./health-check/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    NotificationsModule,
    HealthModule,
    RedisModule,
    AuthModule,
    FarmsModule,
    AnimalsModule,
    MilkModule,
  ],
})
export class AppModule {}
