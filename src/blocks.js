import { registerBlockType } from '@wordpress/blocks';
import { SpecificationTable } from './blocks/specification-table';
import { ComparisonTable } from './blocks/comparison-table';

registerBlockType( SpecificationTable.name, SpecificationTable.settings );
registerBlockType( ComparisonTable.name, ComparisonTable.settings );
