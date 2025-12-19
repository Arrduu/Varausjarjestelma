/**
 * ReservationsList.jsx
 *
 * Renders reservations (user or admin view) and shows reservation details in a modal.
 *
 * Responsibilities:
 *  - Query reservations and items via reactive trackers.
 *  - Render either all reservations (admin=true) or the current user's reservations.
 *  - Allow selecting reservations via checkboxes and returning the selected ones.
 *  - Open a modal for a clicked reservation and render ItemList for that reservation.
 *
 * What the code does (step-by-step):
 *  - Reads current Meteor user (Meteor.user()).
 *  - Uses useTracker to read:
 *      - allReservations (all documents from reservationsCollection)
 *      - allItems (all documents from itemsCollection)
 *      - userReservations (reservations where user == current user id)
 *      - userItems (all items; used to build reservation item lists)
 *  - Sets Modal.setAppElement('#app') for react-modal accessibility.
 *  - Maintains local state:
 *      - modalVisible: whether the reservation details modal is open
 *      - selectedItems: array of selected reservation ids from the checkbox list
 *      - editItem ref: the reservation object currently shown in the modal
 *  - onClick / onClickAdmin:
 *      - Find the clicked reservation by matching clicked text to reservation.name
 *      - Build a shallow items array on the reservation object by iterating items and
 *        pushing those that belong to the reservation (item.reservation === reservation._id)
 *      - Open the modal
 *  - onClickCheckbox:
 *      - Toggle reservation id in selectedItems state when a checkbox is clicked
 *  - onClickReturn:
 *      - Calls Meteor.callAsync('returnReservations', selectedItems, Meteor.userId())
 *      - --- TODO --- Use ErrorModal: surface server errors to the user instead of only console/logging
 *  - onCloseModal:
 *      - Closes modal and clears selectedItems
 *  - Render:
 *      - Title depends on admin prop.
 *      - A list of reservations; each item shows clickable name and a checkbox.
 *      - Modal shows reservation name and ItemList (suspended) for the selected reservation.
 *
 * Usage:
 *  <ReservationsList admin={true|false} />
 */

import React,{startTransition, Suspense} from "react";
import {useFind, useSubscribe, useTracker} from 'meteor/react-meteor-data/suspense';
import Modal from 'react-modal';
import styles from '../styles/reservationList.css';
import {ItemList} from './ItemList';
import {Meteor} from "meteor/meteor"
import { itemsCollection } from "../../api/items";
import { reservationsCollection } from "../../api/reservations";

export const ReservationsList=(props)=>{

  const {admin}=props

  const user = Meteor.user()

    useSubscribe('reservations')

    // useSubscribe('reservations')
  
    // useSubscribe('items')

  const allReservations = useTracker('allReservations', () =>
    reservationsCollection.find().fetch()
  );

  const allItems = useTracker('allItems', () =>
    itemsCollection.find().fetch()
  );

  const userReservations = useTracker('userReservations', () =>
    reservationsCollection.find({ 'user': user._id }).fetch()
  );

  const userItems = useTracker('userItems', () =>
    itemsCollection.find().fetch()
  );

  // Modal accessibility
  Modal.setAppElement('#app')

    const [modalVisible, setModalVisible] = React.useState(false);
    const [selectedItems,setSelectedItems]=React.useState([])
    const editItem=React.useRef();

  // Open modal for a user reservation: attach item list and show modal
  const onClick=(e)=>{
    editItem.current = userReservations.find((item) => item.name === e.target.textContent)
    editItem.current.items = []
    userItems.map(item => {
      if (item.reservation === editItem.current._id) { editItem.current.items.push(item) }
    })
    startTransition(()=>{ setModalVisible(true) })
  }

  // Open modal for an admin click: use allReservations/allItems
  const onClickAdmin=(e)=>{
    editItem.current = allReservations.find((item) => item.name === e.target.textContent)
    editItem.current.items = []
    allItems.map(item => {
      if (item.reservation === editItem.current._id) { editItem.current.items.push(item) }
    })
    startTransition(()=>{ setModalVisible(true) })
  }

  // Call server to return selected reservations
  const onClickReturn=(e)=>{
    Meteor.callAsync('returnReservations', selectedItems, Meteor.userId())
    // --- TODO --- Use ErrorModal: surface server errors to the user instead of only console/logging
  }

  // Checkbox handler: toggle id in selectedItems
  const onClickCheckbox=(e,itemId)=>{
    let tmpItems = selectedItems
    if(e.target.checked){
      tmpItems=[...selectedItems, itemId]
      startTransition(()=>setSelectedItems(tmpItems))
    }else{
      tmpItems.splice(tmpItems.indexOf(itemId),1)
      startTransition(()=>setSelectedItems(tmpItems))
    }
  }

  // Close modal and reset selection
  const onCloseModal=()=>{
    startTransition(()=>{
      setModalVisible(false)
      setSelectedItems([])
    })
  }

  return(
    <div id="reservations-list-container">
      {admin?(<h3>All reservations</h3>):(<h3>User reservations</h3>)}
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
              <Suspense><ItemList reservation={editItem.current._id}/></Suspense>
              <button onClick={onCloseModal}>Close</button>
            </div>):
            (null)}
        </Modal>

        <ul>
          {admin?(
            allReservations.map(item =>
              <li key={item._id} id={`${item.name}`}>
                <label>
                  <a onClick={(e)=>onClickAdmin(e)}>{item.name}</a>
                </label>
                <input id={`${item.name}Checkbox`} type="checkbox" onClick={(e)=>onClickCheckbox(e,item._id)}></input>
              </li>
            )
          ):(
            userReservations.map(item =>
              <li key={item._id} id={`${item.name}`}>
                <label onClick={(e)=>onClick(e)}>
                  <a>{item.name}</a>
                </label>
                <input id={`${item.name}Checkbox`} type="checkbox" onClick={(e)=>onClickCheckbox(e,item._id)}></input>
              </li>
            )
          )}
        </ul>
      </div>

      <div id="userpage-buttons">
        <button onClick={onClickReturn}>Return selection</button>
      </div>
    </div>
  )
}

export default ReservationsList;