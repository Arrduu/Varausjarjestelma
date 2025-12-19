/**
 * App.jsx
 *
 * Top-level application component that chooses which page to render based on
 * authentication and role, and shows the login credentials component when not signed in.
 *
 * Responsibilities:
 *  - Track current user login state (Meteor.userId) reactively.
 *  - Read the current user's role assignment to decide between AdminPage and UserPage.
 *  - Render header (logo + logout) and the appropriate page inside a Suspense boundary.
 *  - Show Creds component when no user is authenticated.
 *
 * What the code does (step-by-step):
 *  - Imports React, Suspense and Meteor reactive hooks.
 *  - Imports role utilities, styles and child page components.
 *  - useTracker('user'): returns the current Meteor user id (reactive).
 *  - useTracker('user-role'): returns the roleAssignment document for the current user.
 *  - onClick (logout): calls Meteor.logout() when the logout button is clicked.
 *  - Render:
 *      - Header with logo and logout button.
 *      - If a user is signed in and a roleAssignment is available:
 *          - If roleAssignment.role._id === 'admin' -> render <AdminPage/> inside Suspense.
 *          - Otherwise render <UserPage/> inside Suspense.
 *      - If no user: render <Creds/> for login.
 *
 * Usage:
 *  <App />
 */
import React from 'react';
import { Suspense } from 'react';
import { useTracker } from 'meteor/react-meteor-data/suspense';
import { Meteor } from "meteor/meteor";
import styles from './styles/app.css';
import UserPage from './UserPage/UserPage';
import AdminPage from './AdminPage/AdminPage';
import Creds from './Creds';

export const App = () => {
  // Reactive current user id
  const user = useTracker('user', () => Meteor.userId());

  // Reactive roleAssignment document for the current user (may be undefined while loading)
  const admin = useTracker('user-role', () => Meteor.roleAssignment.findOne({ 'user._id': user }));

  // Logout handler
  const onClick = () => {
    Meteor.logout();
  };

  return (
    <div id='container' style={styles}>
      <div id='header'>
        <img style={styles} id='logo' src='/images/SMLogo.png' alt='StudioMuuntamoLogo' />
        <button id='logout-button' styles={styles} onClick={onClick}>Logout</button>
      </div>

      {user && admin ? (
        // User is logged in and roleAssignment resolved
        admin.role._id === 'admin' ? (
          <Suspense fallback={<p>Loading...</p>}><AdminPage /></Suspense>
        ) : (
          <Suspense fallback={<p>Loading...</p>}><UserPage /></Suspense>
        )
      ) : (
        // No user signed in
        <div><Creds /></div>
      )}
    </div>
  );
};

export default App;