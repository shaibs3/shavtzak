import { Test, TestingModule } from '@nestjs/testing';
import { SoldiersController } from './soldiers.controller';

describe('SoldiersController', () => {
  let controller: SoldiersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SoldiersController],
    }).compile();

    controller = module.get<SoldiersController>(SoldiersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
