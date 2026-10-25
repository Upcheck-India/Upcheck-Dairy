import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleLoginDto {
    /** The ID token returned by Google Sign-In on the device. */
    @IsString()
    @IsNotEmpty()
    idToken: string;
}
