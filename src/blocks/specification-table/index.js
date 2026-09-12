import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, Placeholder, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import metadata from './block.json';
import './editor.scss';

const SpecificationTableIcon = () => (
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
		className="lucide lucide-table-cells-merge-icon wp-block-specifico-specification-table-icon"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M12 21v-6" fill="none" stroke="currentColor" />
		<path d="M12 9V3" fill="none" stroke="currentColor" />
		<path d="M3 15h18" fill="none" stroke="currentColor" />
		<path d="M3 9h18" fill="none" stroke="currentColor" />
		<rect width="18" height="18" x="3" y="3" rx="2" fill="none" stroke="currentColor" />
	</svg>
);

const parseStyleVars = ( css ) => {
	const vars = {};
	css.split( ';' ).forEach( ( decl ) => {
		const idx = decl.indexOf( ':' );
		if ( idx > 0 ) {
			vars[ decl.slice( 0, idx ).trim() ] = decl.slice( idx + 1 ).trim();
		}
	} );
	return vars;
};

const SpecTable = ( { preview, showSub } ) => {
	const groups = Array.isArray( preview?.groups ) ? preview.groups : [];
	const style = preview?.style || '';
	const styleVars = preview?.style_vars || '';
	const sub = showSub !== undefined ? showSub : preview?.show_sub;

	const tableStyle = {
		width: '100%',
		...( styleVars
			? parseStyleVars( styleVars )
			: {} ),
	};

	const classes = [ 'specifico-table', 'specifico-' + style ]
		.filter( Boolean )
		.join( ' ' );

	return (
		<table className={ classes } style={ tableStyle }>
			{ groups.map( ( group, gi ) => {
				const rows = Array.isArray( group?.inputGroups ) ? group.inputGroups : [];
				return (
					<tbody key={ gi }>
						{ sub && group?.title ? (
							<tr className="specifico-sub">
								<th colSpan="2">{ group.title }</th>
							</tr>
						) : null }
						{ rows.map( ( row, ri ) => {
							const label = row?.[ 0 ]?.value || '';
							const value = row?.[ 1 ]?.value || '';
							if ( ! label && ! value ) {
								return null;
							}
							return (
								<tr key={ ri }>
									<td>{ label }</td>
									<td>{ value }</td>
								</tr>
							);
						} ) }
					</tbody>
				);
			} ) }
		</table>
	);
};

function SpecificationTableEdit( { attributes, setAttributes } ) {
	const { source, tableId } = attributes;
	const [ tables, setTables ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ preview, setPreview ] = useState( null );
	const [ previewLoading, setPreviewLoading ] = useState( false );

	const blockProps = useBlockProps( {
		className: 'wp-block-specifico-specification-table',
	} );

	// Detect if we're on a product page.
	const postType = useSelect(
		( select ) => select( 'core/editor' ).getCurrentPostType(),
		[]
	);
	const isProductPage = postType === 'product';

	// Fetch available specification tables for the dropdown.
	useEffect( () => {
		setLoading( true );
		apiFetch( { path: '/specifico/v1/specification/select' } )
			.then( ( data ) => {
				setTables( Array.isArray( data ) ? data : [] );
				setLoading( false );
			} )
			.catch( () => {
				setTables( [] );
				setLoading( false );
			} );
	}, [] );

	// Fetch render-ready preview data for the selected table.
	useEffect( () => {
		if ( source !== 'specific-table' || ! tableId ) {
			setPreview( null );
			return;
		}
		setPreviewLoading( true );
		apiFetch( { path: `/specifico/v1/specification/${ tableId }/preview` } )
			.then( ( data ) => {
				setPreview( data );
				setPreviewLoading( false );
			} )
			.catch( () => {
				setPreview( null );
				setPreviewLoading( false );
			} );
	}, [ source, tableId ] );

	const selectedTable = tables.find( ( t ) => Number( t.value ) === Number( tableId ) );

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Data Source', 'specifico' ) }>
				<SelectControl
					label={ __( 'Source', 'specifico' ) }
					value={ source }
					options={ [
						{ label: __( 'Current Product', 'specifico' ), value: 'current-product' },
						{ label: __( 'Specific Table', 'specifico' ), value: 'specific-table' },
					] }
					onChange={ ( value ) => setAttributes( { source: value, tableId: 0 } ) }
				/>
				{ source === 'specific-table' && (
					<SelectControl
						label={ __( 'Specification Table', 'specifico' ) }
						value={ tableId }
						options={ [
							{ label: __( 'Select a table...', 'specifico' ), value: 0 },
							...tables.map( ( t ) => ( {
								label: t.label,
								value: t.value,
							} ) ),
						] }
						onChange={ ( value ) =>
							setAttributes( { tableId: parseInt( value, 10 ) } )
						}
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);

	// Product page + current-product mode: auto-render on the frontend.
	if ( isProductPage && source === 'current-product' ) {
		return (
			<div { ...blockProps }>
				{ inspectorControls }
				<Placeholder
					icon="list-view"
					label={ __( 'Specification Table', 'specifico' ) }
					instructions={ __(
						'Product specifications are rendered here on the frontend.',
						'specifico'
					) }
				>
					<p className="spec-block__hint">
						{ __(
							'This block displays the current product\'s specification table.',
							'specifico'
						) }
					</p>
				</Placeholder>
			</div>
		);
	}

	// Specific table selected.
	if ( source === 'specific-table' && tableId ) {
		return (
			<div { ...blockProps }>
				{ inspectorControls }
				<div className="is-placeholder">
					{ previewLoading ? (
						<Spinner />
					) : preview && Array.isArray( preview.groups ) && preview.groups.length ? (
						<SpecTable preview={ preview } />
					) : (
						<>
							<div className="spec-placeholder__title">
								{ selectedTable
									? selectedTable.label
									: __( 'Specification Table', 'specifico' ) }
							</div>
							<p className="spec-block__hint">
								{ __(
									'This table has no specifications yet.',
									'specifico'
								) }
							</p>
						</>
					) }
				</div>
			</div>
		);
	}

	// No product page, no table selected: show setup placeholder.
	return (
		<div { ...blockProps }>
			{ inspectorControls }
			<Placeholder
				icon="list-view"
				label={ __( 'Specification Table', 'specifico' ) }
				instructions={ isProductPage
					? __(
						'This block will render the current product\'s specs on the frontend.',
						'specifico'
					)
					: __(
						'Choose a table in the block settings sidebar, or place this block on a product page to auto-detect the product.',
						'specifico'
					) }
			/>
		</div>
	);
}

export const SpecificationTable = {
	name: metadata.name,
	settings: {
		title: metadata.title,
		description: metadata.description,
		icon: <SpecificationTableIcon />,
		category: metadata.category,
		keywords: metadata.keywords,
		attributes: metadata.attributes,
		supports: metadata.supports,
		edit: SpecificationTableEdit,
		save: () => null,
	},
};
