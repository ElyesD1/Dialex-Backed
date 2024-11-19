import { UsersService } from './users.service';
import { User } from './user.schema';
declare class SignupDto {
    fullName: string;
    email: string;
    password: string;
}
declare class LoginDto {
    email: string;
    password: string;
}
declare class UpdateProfileDto {
    email: string;
    fullName: string;
    newEmail: string;
    password?: string;
    newPassword?: string;
}
declare class AddLanguageDto {
    email: string;
    languageName: string;
    languageKey: string;
}
declare class ForgotPasswordDto {
    email: string;
}
declare class ResetPasswordDto {
    resetToken: string;
    newPassword: string;
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    signup(signupDto: SignupDto): Promise<{
        user: User;
    }>;
    addLanguage(addLanguageDto: AddLanguageDto): Promise<{
        message: string;
    }>;
    getLanguages(email: string): Promise<{
        name: string;
        key: string;
    }[]>;
    googleSignIn(body: {
        googleId: string;
        name: string;
        email: string;
    }): Promise<{
        message: string;
        user: {
            fullName: string;
            email: string;
            level: number;
            points: number;
            streakDays: number;
        };
    }>;
    verifyEmail(token: string): Promise<{
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        fullName: string;
        email: string;
        level: number;
        points: number;
        streakDays: number;
        lastLoginDate: Date;
    }>;
    verifyPassword({ email, password }: {
        email: string;
        password: string;
    }): Promise<{
        valid: boolean;
    }>;
    updateProfile(updateProfileDto: UpdateProfileDto): Promise<{
        user: User;
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    deleteUser({ email }: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    getAllUsers(): Promise<{
        fullName: string;
        points: number;
    }[]>;
}
export {};
