import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Invoice } from "src/invoice/entity/invoice.entity";
@Entity()
export class User{
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    firstName: string;
        
    @Column()
    lastName: string;
        
    @Column({unique: true})
    email: string;

    @OneToMany(() => Invoice, (invoice) => invoice.user)
    invoices: Invoice[];



}