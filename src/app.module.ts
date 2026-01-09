import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/entity/user.entity';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { AgentsModule } from './agents/agents.module';
import { McpModule } from './mcp/mcp.module';
import { LlmModule } from './llm/llm.module';
import { BillingAgentModule } from './agents/billing/billing.module';
import { BillingModule } from './tools/billing/billing.module';
import { Invoice } from "src/invoice/entity/invoice.entity";
import { ReturnModule } from './agents/return/return.module';
@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        console.log(
    'DB_PASSWORD:',
    configService.get('DB_PASSWORD'),
    typeof configService.get('DB_PASSWORD'),
  );
        return {
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Invoice],
        synchronize: true //for production switch to false
      }
    },
      inject: [ConfigService]
    }),
    ChatModule,
    OrchestratorModule,
    AgentsModule,
    McpModule,
    LlmModule,
    BillingAgentModule,
    BillingModule,
    ReturnModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
