
 import { McpClientService } from './client';
// @Module({
//     providers: [McpClientService],
//     exports: [McpClientService]
// })
// export class McpModule {}

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Invoice } from "src/invoice/entity/invoice.entity";
import { User } from "src/user/entity/user.entity";
import { KbToolModule } from 'src/tools/kb/kb.module';
import { BillingToolModule } from "src/tools/billing/billing.module";
import { ReturnToolModule } from "src/tools/return/return.module";
import { EmailModule } from "src/tools/email/email.module"; 
import { TechSupportModule } from 'src/agents/tech/tech.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("DB_HOST"),
        port: +config.get("DB_PORT"),
        username: config.get("DB_USERNAME"),
        password: config.get("DB_PASSWORD"),
        database: config.get("DB_DATABASE"),
        entities: [User, Invoice],
        synchronize: true,
        logging: false,
      }),
    }),

    ReturnToolModule,
    BillingToolModule,
    EmailModule,
    KbToolModule,
    TechSupportModule,
  ],

})
export class McpModule {}
