import React from 'react';
import { render } from 'react-dom';
import SpecTable  from './Specification/SpecTable';

const App = () => {
    return (
        <React.StrictMode>
           <SpecTable />
        </React.StrictMode>
    );
}

render( <App/>, document.getElementById( 'specifico-admin' ) );
