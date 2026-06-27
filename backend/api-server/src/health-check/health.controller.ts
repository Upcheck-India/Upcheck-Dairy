import { Controller, Get } from "@nestjs/common";
import { Public } from "../common/decorators/auth.decorators";
import { SkipThrottle } from "@nestjs/throttler";

@SkipThrottle()
@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: "ok" };
  }
}
