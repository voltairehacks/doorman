import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { ApolloProvider } from 'react-apollo';
import ApolloClient from 'apollo-boost';

import 'semantic-ui-css/semantic.min.css';

const client = new ApolloClient({ uri: 'http://192.168.1.153:5000/graphql' });

ReactDOM.render(<ApolloProvider client={client}><App /></ApolloProvider>, document.getElementById('root'));

