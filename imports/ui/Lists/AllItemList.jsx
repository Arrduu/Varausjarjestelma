/**
 * AllItemList.jsx
 *
 * Renders a searchable list of all inventory items and allows viewing item details
 * and reservations on a calendar.
 *
 * Responsibilities:
 *  - Query the itemsCollection for items matching the current search string.
 *  - Render a list of results; clicking an item opens a modal with details.
 *  - Show a month calendar in the details modal with reserved dates highlighted.
 *  - Clicking a reserved day opens a small calendar-modal showing reservation owner.
 *
 * Props:
 *  - None (reads data from itemsCollection and Meteor.users)
 *
 * Important implementation notes & caveats:
 *  - Accessibility: Modal.setAppElement('#app') is called; ensure the app root has id="app".
 *  - Data subscription: this component uses useTracker to query itemsCollection. Ensure
 *    a suitable publication (items) is subscribed to upstream so items are available client-side.
 *  - Search: items are matched using a RegExp built from `search`. The query contains both
 *    exact-match and regex partial-match clauses for `name`.
 *
 * Usage:
 *  <AllItemList />
 */
 
import React,{startTransition,useEffect} from "react";
import {Meteor} from "meteor/meteor";
import Modal from 'react-modal';
import { registerLocale } from  "react-datepicker";
import { fi } from 'date-fns/locale/fi';
registerLocale('fi',fi)
import "react-datepicker/dist/react-datepicker.css";
import { differenceInCalendarDays, getDate, getDayOfYear } from 'date-fns';
import Calendar from 'react-calendar'; //https://github.com/wojtekmaj/react-calendar
import CalendarStyle from 'react-calendar/dist/Calendar.css';
import {useTracker} from 'meteor/react-meteor-data/suspense';
import styles from '../styles/userPage.css'
import { itemsCollection } from "../../api/items";
import stylesCalendarModal from '../styles/calendarModal.css'





export const AllItemList=(props)=>{

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

    const items = useTracker('itemsSearch',() =>{
        const regex = new RegExp(search, 'i');
        return(
            itemsCollection.find({
                $or: [
                  { name: search }, // Exact match
                  { name: { $regex: regex } } // Partial match
                ]
              }).fetch()
        )
    });

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
                <h3>All items</h3>
                    <div id="item-list-modal-header">
                    <label id="item-list-reservation-search-label">Search items</label>
                        <input id="item-list-all-reservation-search" onChange={onFindSearch} placeholder="search"/>
                    <label>Filter by category</label>
                        <select name="Category" id="find-category-all-items">
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

export default AllItemList;