import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class GoogleLoginDto {
    /** The ID token returned by Google Sign-In on the device. */
    @IsString()
    @IsNotEmpty()
    idToken: string;

    /**
     * Which button the user pressed.
     *
     * 'signin' refuses to create an account, so tapping "Continue with Google"
     * on the sign-in screen with the wrong address reports that no account
     * exists instead of silently provisioning an empty one. 'signup' — and an
     * absent value, for older clients — provisions as before.
     */
    @IsOptional()
    @IsIn(['signin', 'signup'])
    intent?: 'signin' | 'signup';
}
