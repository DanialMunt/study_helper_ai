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
import { BillingToolModule } from './tools/billing/billing.module';
import { Invoice } from "src/invoice/entity/invoice.entity";
import { ReturnAgentModule } from './agents/return/return.module';
import { ReturnToolModule } from './tools/return/return.module';
import { KbToolModule } from './tools/kb/kb.module';
import { EmailModule } from './tools/email/email.module';
import { TechSupportModule } from './agents/tech/tech.module';
import { ConversationSession } from './session/entity/conversation-session.entity';
import { SessionModule } from './session/session.module';
@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
  //       console.log(
  //   'DB_PASSWORD:',
  //   configService.get('DB_PASSWORD'),
  //   typeof configService.get('DB_PASSWORD'),
  // );
        return {
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Invoice, ConversationSession],
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
    BillingToolModule,
    ReturnAgentModule,
    ReturnToolModule,
    EmailModule,
    KbToolModule,
    TechSupportModule,
    SessionModule

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
