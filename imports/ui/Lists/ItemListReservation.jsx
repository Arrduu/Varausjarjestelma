/**
 * ItemListReservation.jsx
 *
 * Small UI used when creating a reservation: shows available items, lets the user
 * pick items, set start/end dates, scan QR codes and create the reservation.
 *
 * Responsibilities:
 *  - Display a searchable, filterable list of available items.
 *  - Let user set reservation start/end dates with DatePicker.
 *  - Preview item details and reserved dates on a small calendar modal.
 *  - Allow selecting items via checkboxes or scanning a QR code.
 *  - Call server method to create the reservation with selected items.
 *
 * Usage:
 *  <ItemListReservation modalSetter={closeFn} />
 *
 * What the code does (step-by-step):
 *  - Registers react-modal app element for accessibility (Modal.setAppElement('#app')).
 *  - Uses useTracker to query all available items from itemsCollection.
 *  - Maintains local state:
 *      - modalVisible / modalVisibleScan / modalVisibleScanError: modal visibility flags
 *      - itemsArr: filtered array derived from the items query
 *      - selectedItems: array of selected item IDs
 *      - resStartDate / resEndDate: reservation date range
 *  - Click on an item name:
 *      - finds the clicked item object, builds an array of reserved dates for that item,
 *      - opens a details modal that contains a Calendar showing reserved days.
 *  - Search/filter:
 *      - Reads values from search input and category select, filters items into itemsArr.
 *  - Checkbox handling:
 *      - Toggles selection of items and stores selected item ids to selectedItems.
 *  - Make reservation:
 *      - Reads reservation name input, current user id and selectedItems,
 *      - Calls Meteor.callAsync('makeReservation', ...), clears selection and closes parent modal.
 *  - QR scanning:
 *      - Opens scanner modal, on successful scan attempts to add scanned item id to selection
 *        if it is available for the chosen start date; otherwise shows scan error modal.
 *
 * --- TODO --- Use ErrorModal: surface server errors to the user instead of only console/logging where applicable.
 */

import React,{startTransition} from "react";
import Modal from 'react-modal';
import DatePicker from 'react-datepicker';
import { registerLocale } from  "react-datepicker";
import { fi } from 'date-fns/locale/fi';
registerLocale('fi',fi)
import "react-datepicker/dist/react-datepicker.css";
import { differenceInCalendarDays, getDate, getDayOfYear } from 'date-fns';
import Calendar from 'react-calendar'; //https://github.com/wojtekmaj/react-calendar
import CalendarStyle from 'react-calendar/dist/Calendar.css';
import {useFind, useSubscribe, useTracker} from 'meteor/react-meteor-data/suspense';
import styles from '../styles/MakeReservation.css'
import { itemsCollection } from "../../api/items";
import { Scanner } from '@yudiel/react-qr-scanner';



export const ItemListReservation=(props)=>{
    const {modalSetter}=props

    const today=new Date()
    today.setUTCHours(0,0,0,0)

    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalVisibleScan, setModalVisibleScan] = React.useState(false);
    const [modalVisibleScanError, setModalVisibleScanError] = React.useState(false);
    const editItem=React.useRef();
    const editItemReservations=React.useRef([]);
    const [selectedItems,setSelectedItems]=React.useState([]);
    const keyIndex=React.useRef(0);
    const [resStartDate,setResStartDate]=React.useState(today);
    const [resEndDate,setResEndDate]=React.useState(today);

    // Reactive query: all items marked available
    const items=useTracker('items',()=>
        itemsCollection.find({available:{$not:false}}).fetch()
    )
    const [itemsArr,setItemsArr]= React.useState(items);

    // Click on item name: prepare reservation dates array, open details modal
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

    const onCloseModal=()=>{
        startTransition(()=>{setModalVisible(false)})
    }

    const onCloseModalScan=()=>{
        startTransition(()=>{setModalVisibleScan(false)})
    }

    const onCloseModalScanError=()=>{
        startTransition(()=>{setModalVisibleScanError(false)})
    }

    // Search/filter handler: reads DOM inputs and filters items into itemsArr
    const onFind=(e)=>{
        let tmpItems=items
        let searchString=document.getElementById("item-list-reservation-search").value
        let searchCategory=document.getElementById("find-category").value
        if(searchCategory){
            console.log('category')
            console.log(searchString)
            tmpItems=(tmpItems.filter((el)=>el.category===searchCategory&&el.name.toLowerCase().includes(searchString.toLowerCase())))
        }else{
            console.log('else')
            console.log(searchString)
            tmpItems=(tmpItems.filter((el)=>el.name.toLowerCase().includes(searchString.toLowerCase())))
        }
        console.log(tmpItems)
        startTransition(()=>setItemsArr(tmpItems))
    }

    // Checkbox toggle: add or remove itemId from selectedItems
    const onClickCheckbox=(e,itemId)=>{
        let tmpItems=selectedItems
        if(e.target.checked){
            tmpItems=[...selectedItems, itemId]
            startTransition(()=>setSelectedItems(tmpItems))
        }else{
            tmpItems.splice(tmpItems.indexOf(itemId),1)
            startTransition(()=>setSelectedItems(tmpItems))
        }

    } 

    // Create reservation: read name, user, selected items and call server method
    const onClickMakeReservation=(e)=>{
        const resName= document.getElementById("make-reservation-name").value
        const user=Meteor.userId()
        const items = selectedItems
        Meteor.callAsync('makeReservation',resName,user,items,resStartDate,resEndDate)
        startTransition(()=>
            {setSelectedItems([])
            modalSetter()})
    }

    // Open QR scanner modal
    const onClickShowScan=(e)=>{
        startTransition(()=>
            {setModalVisibleScan(true)})
    }

    // Show scan error modal
    const onScanError=(e)=>{
        startTransition(()=>
            {setModalVisibleScanError(true)})
    }

    // Calendar tile class: mark reserved dates in month view
    const tileClassName=({view,date})=>{
        if (view === 'month'&&editItemReservations.current.find(res=>differenceInCalendarDays(res,date)===0)){
            return 'react-calendar__tile__reserved'
          }
    }

    // Check if an item is available for the currently selected start date
    const checkItemResByDay=(item)=>{
        let available = true
        item.reservation.map(res=>{
            if(getDayOfYear(res.resStartDate) <= getDayOfYear(resStartDate) && getDayOfYear(res.resEndDate) >= getDayOfYear(resStartDate)){
                available=false
            }           
        })
        return available;
    }

    // Handle QR scan result: add scanned item ID to selection if available for date
    const onScan=(res)=>{
        let tmpItems=selectedItems
        if(itemsArr.map(item=>item._id===res)&&checkItemResByDay(itemsArr.find(item=>item._id===res))){
            tmpItems=[...selectedItems, res]
            startTransition(()=>{
                setSelectedItems(tmpItems)
                onCloseModalScan()
            })
        }else{
            onScanError()
        }

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
                    />
                    <button onClick={onCloseModal}>Close</button>
                </div>):
                (null)}

            </Modal>
            

            <div id="item-list-modal-reservation-container">
                <div id="item-list-modal-header">
                <label id="make-reservation-name-label">Reservation name</label>
                <input id="make-reservation-name" placeholder="Reservation name" required/>
                <label>Start date</label>

                <DatePicker
                    todayButton="Today"
                    showWeekNumbers
                    selected={resStartDate}
                    onChange={(date) => {startTransition(()=>setResStartDate(date))}}
                    dateFormat="dd/MM/yyyy"
                    locale={fi}
                />
                <label>End date</label>

                {/* Set resEndDate to match resStartDate if resEndDate earlier than resStartDate */}
                {resStartDate>resEndDate?(startTransition(()=>setResEndDate(resStartDate))):(null)} 

                <DatePicker
                    todayButton="Today"
                    showWeekNumbers
                    openToDate={resStartDate}
                    minDate={resStartDate}
                    selected={resEndDate}
                    onChange={(date) => {startTransition(()=>setResEndDate(date))}}
                    dateFormat="dd/MM/yyyy"
                    locale={fi}
                />
                <label id="item-list-reservation-search-label">Search items</label>
                <input id="item-list-reservation-search" onChange={onFind} placeholder="search"/>
                <label>Filter by category</label>
                <select onChange={onFind} name="Category" id="find-category">
                    <option defaultChecked value={""}> All </option>
                    <option value="Electronics">Electronics</option>
                    <option value="Cables">Cables</option>
                    <option value="Hardware">Hardware</option>
                </select>
                </div>
                <div id="item-list-reservation-container">
                    {itemsArr[0]!=undefined?(
                        <ul>
                        {
                            itemsArr.map(item=>{
                                if(checkItemResByDay(item)){
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
                                        <input 
                                            id={`${item.name}`}
                                            type="checkbox"
                                            onChange={(e)=>onClickCheckbox(e,item._id)}
                                            defaultChecked={selectedItems.includes(item._id)} >
                                        </input>
                                    </div>)
                                }
                                
                            })
                        }
                        </ul>):
                    (<p style={{textAlign:"center"}}>No items match search</p>)}
                    </div>
                    <Modal
                    isOpen={modalVisibleScan}
                    onRequestClose={onCloseModalScan}
                    className={'item-list-modal-scan'}
                    closeTimeoutMS={300}
                    style={styles}
                    >
                        <Scanner 
                        onScan={(result) =>{
                            if(result[0].rawValue!=''){
                                onScan(result[0].rawValue)
                            }
                        }} 
                        allowMultiple={false} 
                        formats={['qr_code']}
                        />

                        <button style={{'display':'flex', 'margin':'auto', 'marginTop': '10px', 'width':'20vw', 'height':'3vh','alignItems':'center','justifyContent':'center'}}
                            onClick={onCloseModalScan}
                                >Cancel
                        </button>
                        <Modal
                            isOpen={modalVisibleScanError}
                            onRequestClose={onCloseModalScanError}
                            className={'item-list-modal-scan-error'}
                            closeTimeoutMS={300}
                            style={styles}>
                                <h3>ITEM RESERVED</h3>
                                <button 
                                style={{'display':'flex', 'marginTop': '10px', 'width':'20vw', 'height':'3vh','alignItems':'center','justifyContent':'center'}}
                                onClick={onCloseModalScanError}> OK </button>
                        </Modal>
                    </Modal>
                    <button id="make-reservation-button" onClick={onClickShowScan}>Scan QR</button>
                    <button id="make-reservation-button" onClick={onClickMakeReservation}>Make reservation</button>
            </div>


        </div>
    )
}

export default ItemListReservation;