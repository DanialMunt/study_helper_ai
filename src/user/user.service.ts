import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user-dto';

@Injectable()
export class UserService {
    constructor(@InjectRepository(User)
    private readonly userRepository: Repository<User>
){}
    async create(createUserDto: CreateUserDto): Promise<User>{
        const newUser = this.userRepository.create(createUserDto);
        return await this.userRepository.save(newUser)
    }
a
}
