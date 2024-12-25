import React from 'react';
import { render } from 'react-dom';
import Attributes from "./Attributes";

const App = () => {
    return (
        <React.StrictMode>
            <Attributes />
        </React.StrictMode>
    );
}

render( <App/>, document.getElementById( 'specifico-mapping' ) );
