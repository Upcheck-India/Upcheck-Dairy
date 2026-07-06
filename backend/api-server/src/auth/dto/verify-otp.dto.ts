import { IsEmail, IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class VerifyOtpDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    otp: string;

    @IsOptional()
    @IsString()
    hash?: string;
}
