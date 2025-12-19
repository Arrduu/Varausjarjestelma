/**
 * UserPage.jsx
 *
 * Renders the main user view with controls to create reservations and browse items.
 *
 * Responsibilities:
 *  - Render MakeReservation control (opens reservation creation modal).
 *  - Render ReservationsList for the current user (admin={false}).
 *  - Render AllItemList to browse all items.
 *
 * What the code does (step-by-step):
 *  - Imports React, Meteor (for potential future use), stylesheet and child components.
 *  - Returns a container div that mounts:
 *      1) <MakeReservation/> — button + modal to create reservations.
 *      2) <ReservationsList admin={false}/> — user's reservations list and related UI.
 *      3) <AllItemList/> — searchable list of all items with detail modal/calendar.
 *
 * Usage:
 *  <UserPage />
 */
import React from 'react';
import { Meteor } from "meteor/meteor";
import styles from '../styles/userPage.css';
import { ReservationsList } from '../Lists/ReservationsList';
import { AllItemList } from '../Lists/AllItemList';
import MakeReservation from '../MakeReservation/MakeReservation';

export const UserPage = () => {
  return (
    <div id='userpage-container' style={styles}>
      <MakeReservation />
      <ReservationsList admin={false} />
      <AllItemList />
    </div>
  );
};

export default UserPage;