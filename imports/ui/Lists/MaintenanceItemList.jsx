/**
 * MaintenanceItemList.jsx
 *
 * Renders maintenance items list and provides UI to:
 *  - View maintenance item details in a modal.
 *  - See reservations for an item on a calendar and open a small modal
 *    showing who reserved a specific day.
 *  - Mark an item as available again via a server call.
 *
 * What the code does (step-by-step):
 *  - Registers react-modal app element for accessibility (Modal.setAppElement('#app')).
 *  - Subscribes to the 'maintenance' publication (useSubscribe).
 *  - Uses useTracker to read maintenanceCollection filtered by the current search string.
 *  - Maintains local state:
 *      - modalVisible / modalVisibleCalendar: modal visibility flags
 *      - search: current search string
 *      - editItem refs: current item, selected reservation entry and user for calendar modal
 *      - editItemReservations: expanded array of reserved dates for the displayed item
 *  - Clicking an item name:
 *      - Finds the clicked item object from the items array.
 *      - Expands each reservation into individual date objects (pushed into editItemReservations).
 *      - Opens the item details modal which contains a Calendar component.
 *  - Calendar:
 *      - tileClassName highlights reserved days in month view by checking editItemReservations.
 *      - onClickDay finds the reservation entry covering the clicked date and resolves the username
 *        for that reservation to show in a small calendar-modal.
 *  - Make item available:
 *      - onClickItemAvailable calls Meteor.callAsync('returnItemAvailable', item)
 *      - On resolved response the details modal is closed.
 *
 * Usage:
 *  <MaintenanceItemList />
 */

import React,{startTransition, useEffect} from "react";
import {Meteor} from "meteor/meteor";
import Modal from 'react-modal';
import { registerLocale } from  "react-datepicker";
import { fi } from 'date-fns/locale/fi';
registerLocale('fi',fi)
import "react-datepicker/dist/react-datepicker.css";
import { differenceInCalendarDays } from 'date-fns';
import Calendar from 'react-calendar'; //https://github.com/wojtekmaj/react-calendar
import CalendarStyle from 'react-calendar/dist/Calendar.css';
import {useSubscribe, useTracker} from 'meteor/react-meteor-data/suspense';
import styles from '../styles/userPage.css'
import stylesCalendarModal from '../styles/calendarModal.css'
import { maintenanceCollection } from "../../api/maintenance";

export const MaintenanceItemList=(props)=>{

    useSubscribe('maintenance')

    const today=new Date()
    today.setUTCHours(0,0,0,0)

    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalVisibleCalendar, setModalVisibleCalendar] = React.useState(false);
    const [search,setSearch]=React.useState('')
    const editItem=React.useRef();
    const editItemName=React.useRef();
    const editItemUser=React.useRef();
    const editItemReservations=React.useRef([]);
    const keyIndex=React.useRef(0);

    const items = useTracker('maintenanceSearch',() =>{
        const regex = new RegExp(search, 'i');
        return(maintenanceCollection.find({
            $or: [
              { name: search }, // Exact match
              { name: { $regex: regex } } // Partial match
            ]
          })).fetch()
        }
    );

    const onClick=(e)=>{
        editItemReservations.current=[]
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

    const onCloseModal=()=>{
        startTransition(()=>{setModalVisible(false)})
    }

    const onCloseModalCalendar=()=>{
        startTransition(()=>{setModalVisibleCalendar(false)})
    }

    const onFindSearch=(e)=>{
        startTransition(()=>setSearch(e.target.value))
    }

    const tileClassName=({view,date})=>{
        // Add class to tiles in month view only and check if date in reserved array
        if (view === 'month'&&editItemReservations.current.find(res=>differenceInCalendarDays(res,date)===0)){
            return 'react-calendar__tile__reserved'
        }
    }

    const onClickDay=(e)=>{
        editItemName.current=editItem.current.reservation.find(res=>res.resStartDate<=e&&res.resEndDate>=e)
        {editItemName.current!=undefined?(editItemUser.current=Meteor.users.findOne(editItemName.current.user).username):(null)}
        startTransition(()=>{
            setModalVisibleCalendar(true)}
        )    
    }

    const onClickItemAvailable=(item)=>{
        Meteor.callAsync('returnItemAvailable', item)
        .then(res=>{
            if(res){
                onCloseModal();
            }
        })

    }

    return(
        <div id="item-list-reservation" style={styles}>
            <Modal
            isOpen={modalVisible}
            onRequestClose={onCloseModal}
            className={'item-list-modal'}
            closeTimeoutMS={300}
            style={styles}
            >
                {editItem.current?(
                <div>
                    <h1>{editItem.current.name}</h1>
                    <p>{editItem.current.category}</p>
                    <p>{editItem.current.info}</p>
                    <a href={`${editItem.current.manUrl}`} target="_blank">{editItem.current.manUrl}</a>
                    <Calendar
                    style={CalendarStyle}
                    showWeekNumbers={true}
                    tileClassName={tileClassName}
                    onClickDay={onClickDay}
                    />
                    <button onClick={onCloseModal}>Close</button>
                    <button onClick={()=>onClickItemAvailable(editItem.current._id)}>Make item available</button>
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
            

            <div id="item-list-modal-reservation-container">
                <h3>Maintenance</h3>
                    <div id="item-list-modal-header">
                    <label id="item-list-reservation-search-label">Search items</label>
                        <input id="item-list-maintenance-reservation-search" onChange={onFindSearch} placeholder="search"/>
                    <label>Filter by category</label>
                        <select  name="Category" id="find-category-maintenance-items">
                            <option defaultChecked value={""}> All </option>
                            <option value="Electronics">Electronics</option>
                            <option value="Cables">Cables</option>
                            <option value="Hardware">Hardware</option>
                        </select>
                        <div id="item-list-reservation-container">
                            {items?(
                                <ul>
                                {
                                    items.map(item=>{
                                        return(
                                        <div id="item-list-li" key={`${item._id} ${keyIndex.current+=1}`}>
                                            <li onClick={onClick} 
                                                id={`${item._id}`}>
                                                <label>
                                                    <a>
                                                        {item.name}
                                                    </a>
                                                </label>
                                            </li>
                                        </div>)                                      
                                    })
                                }
                                </ul>):
                            (<p style={{textAlign:"center"}}>No items match search</p>)}
                        </div>
                </div>
            </div>
        </div>
    )
}

export default MaintenanceItemList;