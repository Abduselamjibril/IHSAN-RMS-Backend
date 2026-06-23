import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('rems_organization_settings')
export class OrganizationSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'company_name', type: 'varchar', length: 255, default: 'IHSAN Properties & Business Service PLC' })
  companyName: string;

  @Column({ name: 'tin_number', type: 'varchar', length: 50, nullable: true })
  tinNumber: string;

  @Column({ name: 'vat_number', type: 'varchar', length: 50, nullable: true })
  vatNumber: string;



  @Column({ name: 'primary_color', type: 'varchar', length: 7, default: '#4F46E5' })
  primaryColor: string;

  @Column({ name: 'secondary_color', type: 'varchar', length: 7, default: '#1E293B' })
  secondaryColor: string;

  @Column({ name: 'font_family', type: 'varchar', length: 100, default: 'Helvetica' })
  fontFamily: string;

  @Column({ name: 'company_address', type: 'text', nullable: true })
  companyAddress: string;

  @Column({ name: 'company_phone', type: 'varchar', length: 50, nullable: true })
  companyPhone: string;

  @Column({ name: 'company_email', type: 'varchar', length: 100, nullable: true })
  companyEmail: string;

  @Column({ name: 'logo_path', type: 'text', nullable: true })
  logoPath: string;

  @Column({ name: 'company_seal_path', type: 'text', nullable: true })
  companySealPath: string;

  @Column({ name: 'header_image_path', type: 'text', nullable: true })
  headerImagePath: string;

  @Column({ name: 'footer_image_path', type: 'text', nullable: true })
  footerImagePath: string;

  @Column({ name: 'authorized_signatory_name', type: 'varchar', length: 255, nullable: true })
  authorizedSignatoryName: string;

  @Column({ name: 'authorized_signatory_title', type: 'varchar', length: 255, nullable: true })
  authorizedSignatoryTitle: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
