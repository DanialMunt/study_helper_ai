import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user-dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService){}

    @Post('create')
    async createUser(@Body() createUserDto: CreateUserDto){
        await this.userService.create(createUserDto)
        return {message: "User created successfully!"}
    }
}
