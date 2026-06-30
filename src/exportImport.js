import React from 'react';
import { render } from 'react-dom';
import ExportImport from "./ExportImport/index";

const App = () => {
    return (
        <React.StrictMode>
            <ExportImport/>
        </React.StrictMode>
    );
}

render( <App/>, document.getElementById( 'specifico-export-import' ) );
