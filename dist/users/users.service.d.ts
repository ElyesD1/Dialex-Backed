import { Model } from 'mongoose';
import { User } from './user.schema';
export declare class UsersService {
    private userModel;
    private readonly API_KEY;
    constructor(userModel: Model<User>);
    create(fullName: string, email: string, password: string): Promise<User>;
    addPoints(userId: string, pointsToAdd: number): Promise<User>;
    addLanguage(email: string, language: {
        name: string;
        key: string;
    }): Promise<void>;
    getLanguagesByEmail(email: string): Promise<{
        name: string;
        key: string;
    }[]>;
    private sendVerificationEmail;
    createOrUpdateGoogleUser(googleId: string, name: string, email: string): Promise<User>;
    verifyUserEmail(token: string): Promise<User | null>;
    login(email: string, password: string): Promise<{
        fullName: string;
        email: string;
        level: number;
        points: number;
        streakDays: number;
        lastLoginDate: Date;
    }>;
    verifyPassword(email: string, password: string): Promise<boolean>;
    updateProfile(email: string, fullName: string, newEmail: string, password?: string, newPassword?: string): Promise<User>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(resetCode: string, newPassword: string): Promise<void>;
    deleteUserByEmail(email: string): Promise<boolean>;
    getAllUsers(): Promise<User[]>;
}
