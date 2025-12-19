import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';
import App from '../imports/ui/App';

//TODO
//
//
//

//IMPLEMENTED
//
//
//


Meteor.startup(() => {
  const container = document.getElementById('app');
  const root = createRoot(container);
  root.render(<App/>);
});