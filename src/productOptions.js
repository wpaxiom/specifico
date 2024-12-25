import React from 'react';
import { render } from 'react-dom';
import Options from "./Options";

const App = () => {
    return (
        <React.StrictMode>
            <Options />
        </React.StrictMode>
    );
}

render( <App/>, document.getElementById( 'specifico-product-options' ) );
