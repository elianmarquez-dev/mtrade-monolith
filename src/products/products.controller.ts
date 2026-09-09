import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../types';
import { Public } from '../auth/decorators/public.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create({
      ...createProductDto,
      ownerId: request.user.sub,
    });
  }

  @Public()
  @Get()
  findAllPublic(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('inStockOnly') inStockOnly?: string,
    @Query('sortBy') sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest',
  ) {
    return this.productsService.findAllPublic({
      category,
      search,
      inStockOnly: inStockOnly === 'true',
      sortBy,
    });
  }

  @Public()
  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Public()
  @Get(':id')
  findOnePublic(@Param('id') id: string) {
    return this.productsService.findOnePublic(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, request.user.sub, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.productsService.remove(id, request.user.sub);
  }
}
