import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	Placeholder,
	Spinner,
	SearchControl,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useEffect, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import metadata from './block.json';
import './editor.scss';

const MAX_PRODUCTS = 4;

const ComparisonTableIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="lucide lucide-columns-3-icon wp-block-specifico-comparison-table-icon"
		aria-hidden="true"
		focusable="false"
	>
		<rect width="18" height="18" x="3" y="3" rx="2" fill="none" stroke="currentColor" />
		<path d="M9 3v18" fill="none" stroke="currentColor" />
		<path d="M15 3v18" fill="none" stroke="currentColor" />
	</svg>
);

const productTitle = ( product, id ) => {
	const raw = product?.title;
	const text = typeof raw === 'string' ? raw : raw?.raw || raw?.rendered || '';
	return text || sprintf( '#%d', id );
};

function ComparisonTableEdit( { attributes, setAttributes } ) {
	const ids = Array.isArray( attributes.ids ) ? attributes.ids : [];
	const idsKey = ids.join( ',' );

	const [ search, setSearch ] = useState( '' );
	const [ preview, setPreview ] = useState( null );
	const [ previewLoading, setPreviewLoading ] = useState( false );

	const blockProps = useBlockProps( {
		className: 'wp-block-specifico-comparison-table',
	} );

	// Searchable product list from core entity records (WooCommerce registers
	// the product post type in REST, so the editor can query it directly).
	const results = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecords( 'postType', 'product', {
				search: search || undefined,
				per_page: 20,
				orderby: 'title',
				order: 'asc',
				_fields: 'id,title',
			} ),
		[ search ]
	);

	// Resolve titles for the chosen products, including ones outside the
	// current search results.
	const selected = useSelect(
		( select ) => {
			if ( ! ids.length ) {
				return [];
			}
			return select( 'core' ).getEntityRecords( 'postType', 'product', {
				include: ids,
				per_page: ids.length,
				_fields: 'id,title',
			} );
		},
		[ idsKey ]
	);

	const selectedTitles = useMemo( () => {
		const map = new Map(
			( selected || [] ).map( ( product ) => [
				Number( product.id ),
				productTitle( product, product.id ),
			] )
		);
		return ids.map( ( id ) => ( {
			id: Number( id ),
			title: map.get( Number( id ) ) || sprintf( '#%d', id ),
		} ) );
	}, [ idsKey, selected ] );

	const productOptions = useMemo( () => {
		const map = new Map();

		selectedTitles.forEach( ( item ) => {
			map.set( Number( item.id ), item );
		} );

		( results || [] ).forEach( ( product ) => {
			const productId = Number( product.id );
			map.set( productId, {
				id: productId,
				title: productTitle( product, productId ),
			} );
		} );

		return Array.from( map.values() );
	}, [ selectedTitles, results ] );

	const toggleProduct = ( id ) => {
		const productId = Number( id );
		if ( ids.includes( productId ) ) {
			setAttributes( { ids: ids.filter( ( value ) => value !== productId ) } );
			return;
		}
		if ( ids.length >= MAX_PRODUCTS ) {
			return;
		}
		setAttributes( { ids: [ ...ids, productId ] } );
	};

	// Preview the real frontend table via the public compare REST route.
	useEffect( () => {
		if ( ids.length < 2 ) {
			setPreview( null );
			setPreviewLoading( false );
			return;
		}
		setPreviewLoading( true );
		apiFetch( { path: `/specifico/v1/compare?ids=${ idsKey }` } )
			.then( ( data ) => {
				setPreview( data && data.html ? data.html : null );
				setPreviewLoading( false );
			} )
			.catch( () => {
				setPreview( null );
				setPreviewLoading( false );
			} );
	}, [ idsKey ] );

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Products', 'specifico' ) }>
				<p className="comparison-block__hint">
					{ __( 'Choose 2 to 4 products to compare side by side.', 'specifico' ) }
				</p>
				<div className="comparison-block__picker">
					{ selectedTitles.length > 0 && (
						<div className="comparison-block__tokens" aria-label={ __( 'Selected products', 'specifico' ) }>
							{ selectedTitles.map( ( item ) => (
								<span key={ item.id } className="comparison-block__token">
									<span>{ item.title }</span>
									<button
										type="button"
										onClick={ () => toggleProduct( item.id ) }
										aria-label={ __( 'Remove from comparison', 'specifico' ) }
									>
										&times;
									</button>
								</span>
							) ) }
						</div>
					) }
					<SearchControl
						className="comparison-block__search"
						label={ __( 'Search products', 'specifico' ) }
						value={ search }
						onChange={ setSearch }
					placeholder={ __( 'Search products…', 'specifico' ) }
					/>
				</div>
				<ul className="comparison-block__product-list">
					{ productOptions.map( ( product ) => {
						const productId = Number( product.id );
						const isSelected = ids.includes( productId );
						const isDisabled = ! isSelected && ids.length >= MAX_PRODUCTS;
						return (
							<li key={ productId }>
								<button
									type="button"
									className={ isSelected ? 'is-selected' : '' }
									disabled={ isDisabled }
									onClick={ () => toggleProduct( productId ) }
								>
									<span className="comparison-block__check" aria-hidden="true">
										{ isSelected ? '✓' : '' }
									</span>
									<span>{ product.title }</span>
								</button>
							</li>
						);
					} ) }
					{ results && productOptions.length === 0 && (
						<li className="comparison-block__empty">
							{ search
								? __( 'No products match your search.', 'specifico' )
								: __( 'No products found.', 'specifico' ) }
						</li>
					) }
				</ul>
				<div className="comparison-block__count">
					{ sprintf(
						/* translators: 1: selected product count, 2: maximum product count. */
						__( '%1$d of %2$d selected', 'specifico' ),
						ids.length,
						MAX_PRODUCTS
					) }
				</div>
			</PanelBody>
		</InspectorControls>
	);

	return (
		<div { ...blockProps }>
			{ inspectorControls }
			{ selectedTitles.length > 0 && (
				<div className="comparison-block__selection">
					{ selectedTitles.map( ( item ) => (
						<span key={ item.id } className="comparison-block__chip">
							<span>{ item.title }</span>
							<button
								type="button"
								onClick={ () => toggleProduct( item.id ) }
								aria-label={ __( 'Remove from comparison', 'specifico' ) }
							>
								&times;
							</button>
						</span>
					) ) }
				</div>
			) }

			{ previewLoading && (
				<div className="comparison-block__preview">
					<Spinner />
				</div>
			) }

			{ ! previewLoading && preview && (
				<div
					className="comparison-block__preview"
					dangerouslySetInnerHTML={ { __html: preview } }
				/>
			) }

			{ ! previewLoading && ! preview && selectedTitles.length < 2 && (
				<Placeholder
					icon="columns"
					label={ __( 'Comparison Table', 'specifico' ) }
					instructions={ __(
						'Select two or more products in the block settings sidebar to compare them side by side.',
						'specifico'
					) }
				/>
			) }
		</div>
	);
}

export const ComparisonTable = {
	name: metadata.name,
	settings: {
		title: metadata.title,
		description: metadata.description,
		icon: <ComparisonTableIcon />,
		category: metadata.category,
		keywords: metadata.keywords,
		attributes: metadata.attributes,
		supports: metadata.supports,
		edit: ComparisonTableEdit,
		save: () => null,
	},
};
