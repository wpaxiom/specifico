import React from 'react';
import { render } from 'react-dom';
import GroupsTable from "./Groups/GroupsTable";

const App = () => {
    return (
        <React.StrictMode>
            <GroupsTable />
        </React.StrictMode>
    );
}

render( <App/>, document.getElementById( 'specifico-groups' ) );
