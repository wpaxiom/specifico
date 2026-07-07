import( '../sass/specifico.css' );

/**
 * Product comparison — tray + slide-in drawer.
 *
 * Progressive enhancement over the server-rendered "Add to compare" buttons
 * (data-specifico-compare). Tray membership lives in localStorage so it works
 * for guests with no server state; the drawer fetches the rendered comparison
 * table from the public REST endpoint.
 */
( function () {
	'use strict';

	var cfg = window.specificoCompare;
	if ( ! cfg || ! window.localStorage ) {
		return;
	}

	var STORE_KEY = 'specifico_compare';
	var tray, trayList, trayCompareBtn, drawer, drawerBody, overlay;

	function read() {
		try {
			var arr = JSON.parse( window.localStorage.getItem( STORE_KEY ) || '[]' );
			return Array.isArray( arr ) ? arr : [];
		} catch ( e ) {
			return [];
		}
	}

	function write( items ) {
		try {
			window.localStorage.setItem( STORE_KEY, JSON.stringify( items ) );
		} catch ( e ) {}
		return items;
	}

	function ids( items ) {
		return items.map( function ( i ) { return i.id; } );
	}

	function has( items, id ) {
		return ids( items ).indexOf( id ) !== -1;
	}

	function add( id, name ) {
		var items = read();
		if ( has( items, id ) ) {
			return items;
		}
		if ( items.length >= cfg.max ) {
			window.alert( cfg.i18n.maxAlert.replace( '%d', cfg.max ) );
			return items;
		}
		items.push( { id: id, name: name } );
		return write( items );
	}

	function remove( id ) {
		return write( read().filter( function ( i ) { return i.id !== id; } ) );
	}

	function buildUi() {
		tray = document.createElement( 'div' );
		tray.className = 'specifico-compare-tray';
		tray.setAttribute( 'hidden', '' );
		tray.innerHTML =
			'<div class="specifico-compare-tray__inner">' +
				'<ul class="specifico-compare-tray__list"></ul>' +
				'<div class="specifico-compare-tray__actions">' +
					'<button type="button" class="specifico-compare-tray__compare"></button>' +
					'<button type="button" class="specifico-compare-tray__clear"></button>' +
				'</div>' +
			'</div>';
		document.body.appendChild( tray );

		trayList = tray.querySelector( '.specifico-compare-tray__list' );
		trayCompareBtn = tray.querySelector( '.specifico-compare-tray__compare' );
		var clearBtn = tray.querySelector( '.specifico-compare-tray__clear' );
		trayCompareBtn.textContent = cfg.i18n.view;
		clearBtn.textContent = cfg.i18n.clear;
		clearBtn.addEventListener( 'click', function () { render( write( [] ) ); } );
		trayCompareBtn.addEventListener( 'click', onCompare );

		overlay = document.createElement( 'div' );
		overlay.className = 'specifico-compare-overlay';
		overlay.setAttribute( 'hidden', '' );
		overlay.addEventListener( 'click', closeDrawer );
		document.body.appendChild( overlay );

		drawer = document.createElement( 'div' );
		drawer.className = 'specifico-compare-drawer';
		drawer.setAttribute( 'hidden', '' );
		drawer.setAttribute( 'role', 'dialog' );
		drawer.setAttribute( 'aria-modal', 'true' );
		drawer.setAttribute( 'aria-label', cfg.i18n.title );
		drawer.innerHTML =
			'<div class="specifico-compare-drawer__head">' +
				'<span class="specifico-compare-drawer__title"></span>' +
				'<button type="button" class="specifico-compare-drawer__close" aria-label="' + cfg.i18n.close + '">&times;</button>' +
			'</div>' +
			'<div class="specifico-compare-drawer__body"></div>';
		drawer.querySelector( '.specifico-compare-drawer__title' ).textContent = cfg.i18n.title;
		drawer.querySelector( '.specifico-compare-drawer__close' ).addEventListener( 'click', closeDrawer );
		drawerBody = drawer.querySelector( '.specifico-compare-drawer__body' );
		document.body.appendChild( drawer );
	}

	function render( items ) {
		if ( ! items.length ) {
			tray.setAttribute( 'hidden', '' );
		} else {
			tray.removeAttribute( 'hidden' );
			trayList.innerHTML = '';
			items.forEach( function ( item ) {
				var li = document.createElement( 'li' );
				li.className = 'specifico-compare-tray__item';

				var name = document.createElement( 'span' );
				name.className = 'specifico-compare-tray__name';
				name.textContent = item.name || ( '#' + item.id );

				var btn = document.createElement( 'button' );
				btn.type = 'button';
				btn.className = 'specifico-compare-tray__remove';
				btn.setAttribute( 'aria-label', cfg.i18n.remove );
				btn.innerHTML = '&times;';
				btn.addEventListener( 'click', function () { render( remove( item.id ) ); } );

				li.appendChild( name );
				li.appendChild( btn );
				trayList.appendChild( li );
			} );
			trayCompareBtn.disabled = items.length < 2;
		}
		syncButtons( items );
	}

	function syncButtons( items ) {
		var buttons = document.querySelectorAll( '[data-specifico-compare]' );
		Array.prototype.forEach.call( buttons, function ( btn ) {
			var id = parseInt( btn.getAttribute( 'data-product-id' ), 10 );
			var active = has( items, id );
			btn.classList.toggle( 'is-active', active );
			btn.setAttribute( 'aria-pressed', active ? 'true' : 'false' );
			var label = btn.querySelector( '.specifico-compare-btn__label' );
			if ( label ) {
				label.textContent = active ? cfg.i18n.added : cfg.i18n.compare;
			}
		} );
	}

	// Tray "Compare" action. When a dedicated comparison page is configured,
	// send the shopper there with the selected IDs; otherwise open the drawer.
	function onCompare() {
		var items = read();
		if ( items.length < 2 ) {
			return;
		}
		if ( cfg.pageUrl ) {
			var psep = cfg.pageUrl.indexOf( '?' ) === -1 ? '?' : '&';
			window.location.href = cfg.pageUrl + psep + 'specifico_compare=' + encodeURIComponent( ids( items ).join( ',' ) );
			return;
		}
		openDrawer();
	}

	function openDrawer() {
		var items = read();
		if ( items.length < 2 ) {
			return;
		}
		overlay.removeAttribute( 'hidden' );
		drawer.removeAttribute( 'hidden' );
		document.body.classList.add( 'specifico-compare-open' );
		drawerBody.innerHTML = '<div class="specifico-compare-loading"></div>';

		var sep = cfg.restUrl.indexOf( '?' ) === -1 ? '?' : '&';
		var url = cfg.restUrl + sep + 'ids=' + encodeURIComponent( ids( items ).join( ',' ) );

		window.fetch( url, { headers: { Accept: 'application/json' } } )
			.then( function ( r ) { return r.json(); } )
			.then( function ( data ) {
				drawerBody.innerHTML = data && data.html ? data.html : '';
				bindDrawerRemovals();
			} )
			.catch( function () { drawerBody.innerHTML = ''; } );
	}

	function bindDrawerRemovals() {
		var removals = drawerBody.querySelectorAll( '[data-specifico-compare-remove]' );
		Array.prototype.forEach.call( removals, function ( btn ) {
			btn.addEventListener( 'click', function () {
				var id = parseInt( btn.getAttribute( 'data-product-id' ), 10 );
				var items = remove( id );
				render( items );
				if ( items.length < 2 ) {
					closeDrawer();
				} else {
					openDrawer();
				}
			} );
		} );
	}

	function closeDrawer() {
		overlay.setAttribute( 'hidden', '' );
		drawer.setAttribute( 'hidden', '' );
		document.body.classList.remove( 'specifico-compare-open' );
	}

	// Toggle a product in/out of the tray (event delegation, so it works for
	// buttons injected after load too).
	document.addEventListener( 'click', function ( e ) {
		var btn = e.target.closest ? e.target.closest( '[data-specifico-compare]' ) : null;
		if ( ! btn ) {
			return;
		}
		e.preventDefault();
		var id = parseInt( btn.getAttribute( 'data-product-id' ), 10 );
		if ( ! id ) {
			return;
		}
		var items = has( read(), id )
			? remove( id )
			: add( id, btn.getAttribute( 'data-product-name' ) || '' );
		render( items );
	} );

	document.addEventListener( 'keydown', function ( e ) {
		if ( 'Escape' === e.key ) {
			closeDrawer();
		}
	} );

	function init() {
		buildUi();
		render( read() );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', init );
	} else {
		init();
	}
}() );
