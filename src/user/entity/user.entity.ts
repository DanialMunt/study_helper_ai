import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Invoice } from "src/invoice/entity/invoice.entity";
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar" })
    firstName: string;

    @Column({ type: "varchar" })
    lastName: string;

    @Column({ unique: true, type: "varchar" })
    email: string;

    @OneToMany(() => Invoice, (invoice) => invoice.user)
    invoices: Invoice[];



}