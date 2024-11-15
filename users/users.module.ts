import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './user.schema';  // Import the User schema from the correct path

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),  // Register the User model with Mongoose
  ],
  controllers: [UsersController],  // Register the UsersController
  providers: [UsersService],  // Register the UsersService
})
export class UsersModule {}