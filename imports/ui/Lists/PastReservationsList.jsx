/**
 * PastReservationsList.jsx
 *
 * Renders a list of past reservations and opens a modal to view items from a selected past reservation.
 *
 * Responsibilities:
 *  - Subscribe to the 'pastReservations' publication.
 *  - Query the pastReservationsCollection and render each reservation as a clickable list item.
 *  - Open a modal for the selected reservation and render PastReservationsItemList inside a Suspense wrapper.
 *
 * What the code does (step-by-step):
 *  - Calls Modal.setAppElement('#app') to configure react-modal accessibility.
 *  - Reads the current Meteor user (used for potential conditional rendering/permissions).
 *  - Starts the 'pastReservations' subscription (useSubscribe).
 *  - Uses useTracker to fetch all past reservations from pastReservationsCollection.
 *  - Maintains modalVisible state and an editItem ref to hold the currently selected reservation.
 *  - onClick: finds the clicked reservation by name, clears its items array (local), and opens the modal.
 *  - onCloseModal: closes the modal and clears editItem.current.
 *  - Renders:
 *      - A list of past reservations; clicking a reservation name opens the modal.
 *      - The modal contains the reservation name and a Suspense-wrapped PastReservationsItemList
 *        which receives the selected reservation _id as a prop.
 *
 * Usage:
 *  <PastReservationsList />
 *
 * --- TODO --- Use ErrorModal: surface subscription / lookup errors to the user where applicable.
 */

import React,{startTransition, Suspense} from "react";
import {useFind, useSubscribe, useTracker} from 'meteor/react-meteor-data/suspense';
import Modal from 'react-modal';
import styles from '../styles/itemList';
import {PastReservationsItemList} from './PastReservationsItemList';
import {Meteor} from "meteor/meteor"
import { itemsCollection } from "../../api/items";
import { reservationsCollection } from "../../api/reservations";
import { pastReservationsCollection } from "../../api/pastReservations";


export const PastReservationsList=()=>{

    useSubscribe('pastReservations')

    const user = Meteor.user()

    const pastReservations = useTracker('pastReservations',()=>
        pastReservationsCollection.find().fetch()
    );

    const [modalVisible, setModalVisible] = React.useState(false);
    const editItem=React.useRef();


    const onClick=(e)=>{
        editItem.current=pastReservations.find((item)=>item.name===e.target.textContent)
        startTransition(()=>{setModalVisible(true)})
    }

    const onCloseModal=()=>{
        startTransition(()=>{
            setModalVisible(false)
        })
    }

    return(
    <div id="reservations-list-container">
        <h3>Past reservations</h3>
        <div id="reservations-list" style={styles}>
            
            <Modal
            isOpen={modalVisible}
            onRequestClose={onCloseModal}
            className={'reservations-list-modal'}
            closeTimeoutMS={300}
            style={styles}
            >
                {editItem.current?(
                <div id="reservations-list-modal-container" style={{display:"flex", flexDirection:'column', alignItems:'center'}}>
                    <h1>{editItem.current.name}</h1>
                    <Suspense><PastReservationsItemList reservation={editItem.current._id}/></Suspense>
                    <button onClick={onCloseModal}>Close</button>
                </div>):
                (null)}
                

            </Modal>
            <ul>

            {pastReservations.map(item=>
            <li 
                key={item._id} 
                id={`${item.name}`}>
                <label>
                    <a 
                    onClick={(e)=>onClick(e)} >
                        {item.name}
                    </a>
                </label>
            </li>
            )}
            </ul>
        </div>
    </div>
    )
}

export default PastReservationsList;