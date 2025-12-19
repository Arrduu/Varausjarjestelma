/**
 * ItemListAddItem.jsx
 *
 * Small modal used inside reservation editing to add available items to a reservation.
 *
 * Responsibilities:
 *  - Render a searchable list of available items (not currently reserved to this reservation).
 *  - Allow selecting multiple items via checkboxes and add them to the reservation.
 *  - Show a small details modal for a clicked item.
 *
 * Props:
 *  - modalSetter: function   Called after add completes to notify parent (closes parent modal).
 *  - reservation: string     The reservation _id to add items to.
 *
 * Implementation notes & caveats:
 *  - Accessibility: Modal.setAppElement('#app') is called; ensure your app root has id="app".
 *  - Data: uses useTracker('items', ...) to read itemsCollection; ensure a matching publication
 *    (items) is subscribed at a parent scope so data is available client-side.
 *  - Search & filtering:
 *      - The component builds a filtered itemsArr from the full items list on every onFind call.
 *  - Server call:
 *      - Meteor.callAsync('addItemToReservation', selectedItems, reservation, user) is used and
 *        currently only handles the resolved case. Surface server errors to the user.
 *      - --- TODO --- Use ErrorModal: replace console.error(...) or silent failure with setting an error ref and opening ErrorModal
 *
 * TODO / Improvements:
 *  - Add error handling UI (ErrorModal) for server call failures and validation.
 *
 * Usage:
 *  <ItemListAddItem modalSetter={closeFn} reservation={reservationId} />
 */
import React,{startTransition} from "react";
import Modal from 'react-modal';
import {Meteor} from 'meteor/meteor'
import {useTracker} from 'meteor/react-meteor-data/suspense';
import styles from '../styles/addItemModal.css'
import { itemsCollection } from "../../api/items";


export const ItemListAddItem=(props)=>{
    const {modalSetter, reservation}=props

    const items=useTracker('items',()=>
        itemsCollection.find({available:{$not:false},'reservation._id':{$not:reservation}}).fetch()
    )
    const [itemsArr,setItemsArr]= React.useState(items);

    const [modalVisible, setModalVisible] = React.useState(false);
    const editItem=React.useRef();
    const [selectedItems,setSelectedItems]=React.useState([]);
    const keyIndex=React.useRef(0);

    const onClick=(e)=>{
        editItem.current=(items.find((item)=>item.name===e.target.textContent))
        startTransition(()=>{
            setModalVisible(true)
        })   
    }

    const onCloseModal=()=>{
        startTransition(()=>{setModalVisible(false)})
    }

    const onFind=(e)=>{
        let tmpItems=items
        let searchString=document.getElementById("item-list-reservation-search").value
        let searchCategory=document.getElementById("find-category").value
        if(searchCategory){
            tmpItems=(tmpItems.filter((el)=>el.category===searchCategory&&el.name.toLowerCase().includes(searchString.toLowerCase())))
        }else{
            tmpItems=(tmpItems.filter((el)=>el.name.toLowerCase().includes(searchString.toLowerCase())))
        }
        
        startTransition(()=>setItemsArr(tmpItems))
    }

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

    const onClickAddItem=(e)=>{
        e.preventDefault()
        const user=Meteor.userId()
        Meteor.callAsync('addItemToReservation',selectedItems,reservation,user)
        .then(res=>{
            startTransition(()=>modalSetter())
        })
        .catch(err=>{
            // --- TODO --- Use ErrorModal: surface this server error to the user instead of silent failure
            // eslint-disable-next-line no-console
            console.error('addItemToReservation failed', err)
        })
    }

    return(
        <div id="item-list-add-item" style={styles}>
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
                    <p>{editItem.current.reserveDate.toLocaleString()}</p>
                    <button onClick={onCloseModal}>Close</button>
                </div>):
                (null)}

            </Modal>
            <div id="item-list-modal-container">
                <div id="item-list-modal-header">
                <label id="item-list-reservation-search-label">Search from items</label>
                <input id="item-list-reservation-search" onChange={onFind} placeholder="search"/>
                <label>Filter by category</label>
                <select onChange={onFind} name="Category" id="find-category">
                    <option defaultChecked value={""}> Select a category </option>
                    <option value="Electronics">Electronics</option>
                    <option value="Cables">Cables</option>
                    <option value="Hardware">Hardware</option>
                </select>
                </div>
                <div id="item-list-container">
                    {itemsArr[0]!=undefined?(<ul>
                    {itemsArr.map(item=>
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
                    </div>
                    )}
                    </ul>):
                    (<p style={{textAlign:"center"}}>No items match search</p>)}
                    </div>
                    <button id="make-reservation-button" onClick={onClickAddItem}>Add item</button>
            </div>


        </div>
    )
}

export default ItemListAddItem;