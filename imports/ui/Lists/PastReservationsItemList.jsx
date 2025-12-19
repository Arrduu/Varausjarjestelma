/**
 * PastReservationsItemList.jsx
 *
 * Renders items that belonged to a past reservation and allows viewing item details
 * and reservations on a calendar.
 *
 * Responsibilities:
 *  - Query items (from itemsCollection) and the single past reservation (pastReservationsCollection).
 *  - Render a list of items that were part of the past reservation.
 *  - Open an item details modal with a month calendar that highlights reserved days.
 *  - Clicking a reserved day opens a small modal that shows which user reserved that day.
 *
 * Usage:
 *  <PastReservationsItemList reservation={reservationId} />
 *
 * What the code does (step-by-step):
 *  - Calls Modal.setAppElement('#app') for react-modal accessibility.
 *  - Reads all items via useTracker and the past reservation document via useTracker.
 *  - Keeps internal refs and state: editItem, arrays of reservation dates, modal visibility flags.
 *  - When an item name is clicked:
 *      - Finds the clicked item object from items.current.
 *      - Expands each reservation entry into individual Date objects (pushed into editItemReservations).
 *      - Opens the details modal.
 *  - Calendar in the modal:
 *      - tileClassName marks reserved dates (month view) by comparing dates with differenceInCalendarDays.
 *      - onClickDay finds the reservation entry covering the clicked date and resolves the username
 *        for that reservation (Meteor.users.findOne) to display in a small calendar-modal.
 *
 * Notes:
 *  - The component expects the reservation prop to be the past reservation _id.
 *  - Styling and modal class names are applied as in the existing implementation.
 *
 * --- TODO --- Use ErrorModal: surface lookup or server errors to the user where appropriate (currently the code assumes lookups succeed).
 */

import React, { startTransition, Suspense, useEffect} from 'react';
import {Meteor} from 'meteor/meteor'
import { useSubscribe, useTracker} from 'meteor/react-meteor-data/suspense';
import Calendar from 'react-calendar'; //https://github.com/wojtekmaj/react-calendar
import Modal from 'react-modal';
import styles from '../styles/itemList.css'
import stylesCalendarModal from '../styles/calendarModal.css'
import { differenceInCalendarDays } from 'date-fns';
import { itemsCollection } from '../../api/items';
import CalendarStyle from 'react-calendar/dist/Calendar.css';
import { pastReservationsCollection } from '../../api/pastReservations';

export const PastReservationsItemList=(props)=>{
    const {reservation} = props

    const pastReservation=useTracker('pastReservations',()=>pastReservationsCollection.find({"_id":reservation}, {fields:{items : 1}}).fetch())

    const items = pastReservation[0] ? pastReservation[0].items : [];

    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalVisibleCalendar, setModalVisibleCalendar] = React.useState(false);
    const editItem=React.useRef();
    const editItemReservations=React.useRef([]);
    const editItemName=React.useRef();
    const editItemUser=React.useRef();
    const selectedItems=React.useRef([]);
    const keyIndex=React.useRef(0);

    const onClick=(e)=>{
        editItem.current=(items.find((item)=>item.name===e.target.textContent))
        editItem.current.reservation.map((res)=>{
            let tmpDate=new Date(res.resStartDate);
            res.resStartDate.setHours(0,0,0,0)
            res.resEndDate.setHours(0,0,0,0)
            let resLen=differenceInCalendarDays(res.resEndDate,res.resStartDate);
            for(i=0;i<=resLen;i++){
                editItemReservations.current.push(new Date(tmpDate))
                tmpDate.setDate(tmpDate.getDate()+1)
            }
        })
        startTransition(()=>{
            setModalVisible(true)
        })  
    }

    onClickCheckbox=(e)=>{
        if(e.target.checked){
            selectedItems.current=[...selectedItems.current, e.target.parentNode.childNodes[0].id]
        }else{
            selectedItems.current.splice(selectedItems.current.indexOf(e.target.parentNode.childNodes[0].id),1)
        }
    }

    const onCloseModal=()=>{
        startTransition(()=>{setModalVisible(false)})
    }

    const onCloseModalCalendar=()=>{
        startTransition(()=>{setModalVisibleCalendar(false)})
    }

    const tileClassName=({date,view})=>{
        // Add class to tiles in month view only and check if date in reserved array
        if (view === 'month'&&editItemReservations.current.find(res=>differenceInCalendarDays(res,date)===0)){
            return 'react-calendar__tile__reserved'
          }
    }

    const onClickDay=(e)=>{
        editItemName.current=editItem.current.reservation.find(res=>res.resStartDate<=e&&res.resEndDate>=e)
        editItemUser.current=Meteor.users.findOne(editItemName.current.user).username
        startTransition(()=>{
            setModalVisibleCalendar(true)}
        )    
    }
 
    return(
        <div id="item-list" style={styles}>
            <Modal
            isOpen={modalVisible}
            onRequestClose={onCloseModal}
            className={'item-list-modal'}
            closeTimeoutMS={300}
            style={styles}
            >
                {editItem.current!=undefined?(
                <div>
                    <h1>{editItem.current.name}</h1>
                    <p>{editItem.current.category}</p>
                    <p>{editItem.current.info}</p>
                    <a href={`${editItem.current.manUrl}`} target="_blank" rel="noreferrer">{editItem.current.manUrl}</a>

                    <Calendar
                    style={CalendarStyle}
                    showWeekNumbers={true}
                    tileClassName={tileClassName}
                    onClickDay={onClickDay}
                    />
                    <button onClick={onCloseModal}>Close</button>
                    {editItemName.current!=undefined?(
                        <Modal
                        isOpen={modalVisibleCalendar}
                        onRequestClose={onCloseModalCalendar}
                        className={'item-list-calendar-modal'}
                        closeTimeoutMS={300}
                        style={stylesCalendarModal}>
                            <h3>{editItemName.current.name}</h3>
                            <p>Reserved to: {editItemUser.current}</p>
                            <button onClick={onCloseModalCalendar}>Close</button>
                        </Modal>
                    ):(null)}


                </div>):
                (null)}

            </Modal>
            {items.length!=0?(
            
            <div id="item-list-modal-container">
            <ul>
            {items.map(item=>
            <div id='item-list-edit-li' key={`${item._id} ${keyIndex.current+=1}`}>
            <li onClick={(e)=>onClick(e)} 
                key={keyIndex.current+=1} 
                id={`${item._id}`}>
                <label>
                    <a>
                        {item.name}
                    </a>
                </label>
            </li>
            </div>
            )}
            </ul>
            </div>
            ):
            (<div>
                <p style={{textAlign:'center'}}>Reservation is empty</p>
            </div>)}
        </div>
    )
}

export default PastReservationsItemList;