import { Body, Controller, Post, Get, Query, Delete, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.schema';
import { IsEmail, IsString, MinLength } from 'class-validator';

// DTO for Signup
class SignupDto {
  @IsString()
  @MinLength(1)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

// DTO for Login
class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// DTO for updating profile
class UpdateProfileDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsEmail()
  newEmail: string;

  @IsString()
  password?: string;

  @IsString()
  newPassword?: string;
}

// DTO for Forgot Password
class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

// DTO for Reset Password
class ResetPasswordDto {
  @IsString()
  resetToken: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto): Promise<{ user: User }> {
    try {
      const user = await this.usersService.create(signupDto.fullName, signupDto.email, signupDto.password);
      return { user };
    } catch (error) {
      throw new BadRequestException('Signup failed: ' + error.message);
    }
  }

  @Post('google-signin')
  async googleSignIn(@Body() body: { googleId: string; name: string; email: string }) {
    const { googleId, name, email } = body;
    if (!googleId || !name || !email) {
      throw new BadRequestException('Google credentials are missing or incomplete.');
    }

    const user = await this.usersService.createOrUpdateGoogleUser(googleId, name, email);

    return {
      message: 'User signed in successfully.',
      user: {
        fullName: user.fullName,
        email: user.email,
        level: user.level,
        points: user.points,
        streakDays: user.streakDays, // Include streakDays in the response
      },
    };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const user = await this.usersService.verifyUserEmail(token);

    if (user) {
      return { message: 'Email verified successfully!' };
    } else {
      throw new BadRequestException('Invalid or expired token.');
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ 
    fullName: string;
    email: string;
    level: number;
    points: number;
    streakDays: number;
    lastLoginDate: Date; // Added lastLoginDate to the response
  }> {
    try {
      // Authenticate the user with email and password
      const user = await this.usersService.login(loginDto.email, loginDto.password);
      
      // Fetch the user data including streakDays and lastLoginDate
      return {
        fullName: user.fullName,
        email: user.email,
        level: user.level,
        points: user.points,
        streakDays: user.streakDays,  // Include streakDays
        lastLoginDate: user.lastLoginDate, // Include lastLoginDate
      };
    } catch (error) {
      // If authentication fails, throw an UnauthorizedException
      throw new UnauthorizedException('Login failed: ' + error.message);
    }
  }

  @Post('verifyPassword')
  async verifyPassword(@Body() { email, password }: { email: string; password: string }): Promise<{ valid: boolean }> {
    try {
      const isValid = await this.usersService.verifyPassword(email, password);
      return { valid: isValid };
    } catch (error) {
      throw new UnauthorizedException('Password verification failed: ' + error.message);
    }
  }

  @Post('update')
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto): Promise<{ user: User }> {
    try {
      const updatedUser = await this.usersService.updateProfile(
        updateProfileDto.email,
        updateProfileDto.fullName,
        updateProfileDto.newEmail,
        updateProfileDto.password,
        updateProfileDto.newPassword,
      );
      return { user: updatedUser };
    } catch (error) {
      throw new BadRequestException('Profile update failed: ' + error.message);
    }
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.usersService.forgotPassword(forgotPasswordDto.email);
    return { message: 'Password reset email sent' };
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.usersService.resetPassword(resetPasswordDto.resetToken, resetPasswordDto.newPassword);
    return { message: 'Password has been reset successfully' };
  }

  @Delete('delete')
  async deleteUser(@Body() { email }: { email: string }): Promise<{ message: string }> {
    try {
      const result = await this.usersService.deleteUserByEmail(email);
      if (result) {
        return { message: 'User deleted successfully' };
      } else {
        throw new BadRequestException('User not found or deletion failed');
      }
    } catch (error) {
      throw new BadRequestException('User deletion failed: ' + error.message);
    }
  }
  @Get('all')
  async getAllUsers(): Promise<{ fullName: string; points: number }[]> {
    try {
      // Fetch all users with selected fields
      const users = await this.usersService.getAllUsers();
      return users.map(user => ({
        fullName: user.fullName,
        points: user.points,
      }));
    } catch (error) {
      throw new BadRequestException('Failed to fetch users: ' + error.message);
    }
  }
  
}