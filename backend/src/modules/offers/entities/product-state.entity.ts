import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ImageCandidate } from '../ranking';

@Entity()
export class ProductState {
  @PrimaryColumn()
  productId: string;

  @Column('simple-json')
  candidates: ImageCandidate[];

  @Column({ type: 'datetime' })
  updatedAt: Date;
}
