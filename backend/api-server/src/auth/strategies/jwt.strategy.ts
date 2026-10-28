import { Injectable, Inject, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { UserRepository } from "../repositories/user.repository";
import { toPublicFarmer, type PublicFarmer } from "../../common/public-farmer";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) configService: ConfigService,
    @Inject(UserRepository) private userRepository: UserRepository
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET")!,
    });
  }

  /**
   * Whatever this returns becomes `request.user`, which is what `@GetUser()`
   * hands to controllers — and a controller returning it is how the password
   * hash and TOTP secret leaked before. Strip them here so the secrets never
   * reach a request context at all, and the leak cannot recur by someone
   * writing a bare `return user`.
   *
   * Nothing downstream needs them: controllers only read `user.id`, and the
   * password check in AuthService.login loads its own row from the repository.
   */
  async validate(payload: { sub: string; email: string }): Promise<PublicFarmer> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("User not found or disabled");
    }
    return toPublicFarmer(user);
  }
}
