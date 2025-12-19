/**
 * AdminPage.jsx
 *
 * Admin dashboard view that shows controls for creating accounts, items and reservations
 * and displays lists of current/past reservations and items.
 *
 * Responsibilities:
 *  - Subscribe to publications required by the admin UI (items, reservations, allUserData).
 *  - Render control components: CreateAccount, MakeItem, MakeReservation.
 *  - Render lists: ReservationsList (user/admin), PastReservationsList, MaintenanceItemList, AllItemList.
 *
 * Notes:
 *  - This component uses meteor/react-meteor-data's suspense API:
 *      useSubscribe('publicationName') to initiate subscriptions and
 *      Suspense + useTracker hooks (used in child list components) to suspend rendering
 *      until data is available.
 *  - Subscriptions are started unconditionally at component render. If you need to start
 *    them conditionally or avoid re-subscribing on every render, lift them to a higher
 *    scope or memoize the subscription parameters.
 *  - CSS is imported from ../styles/adminPage.css and applied via element ids.
 *
 * Usage:
 *  <AdminPage />
 *
 */
import React from 'react';
import {Suspense} from 'react';
import { useSubscribe, useTracker} from 'meteor/react-meteor-data/suspense';
import CreateAccount from './CreateAccount';
import MakeItem from './MakeItem';
import {ReservationsList} from '../Lists/ReservationsList';
import MakeReservation from '../MakeReservation/MakeReservation';
import AllItemList from '../Lists/AllItemList';
import PastReservationsList from '../Lists/PastReservationsList';
import MaintenanceItemList from '../Lists/MaintenanceItemList';

export const AdminPage = () => {
  // Start subscriptions required by admin UI.
  // These calls integrate with React Suspense via the suspense-enabled hooks.
  useSubscribe('items')
  useSubscribe('allUserData')

  return (
    <div id='adminpage-container'>
      <div id='adminpage-buttons'>
      <CreateAccount/>
      <MakeItem/> 
      <Suspense fallback={<p>Loading...</p>}><MakeReservation/></Suspense>
      </div>

      <div id='grid'>
      <div id='row1'>
        <Suspense fallback={<p>Loading...</p>}><ReservationsList admin={false}/></Suspense>
        <Suspense fallback={<p>Loading...</p>}><ReservationsList admin={true}/></Suspense>
      </div>
      <div id='row2'>
        <Suspense fallback={<p>Loading...</p>}><PastReservationsList/></Suspense>
      </div>
      <div id='row3'>
        <Suspense fallback={<p>Loading...</p>}><MaintenanceItemList/></Suspense>
        <Suspense fallback={<p>Loading...</p>}><AllItemList/></Suspense>
      </div>
      </div>
    </div>
  );

};

export default AdminPage;