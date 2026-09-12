import { registerBlockType } from '@wordpress/blocks';
import { SpecificationTable } from './blocks/specification-table';

registerBlockType( SpecificationTable.name, SpecificationTable.settings );
