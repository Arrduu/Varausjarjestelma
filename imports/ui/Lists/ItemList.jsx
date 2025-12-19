/**
 * ItemList.jsx
 *
 * Renders items belonging to a reservation and provides UI to:
 *  - View item details (modal) and see reservations on a calendar.
 *  - Select items (checkboxes) to return or send to maintenance.
 *  - Add items to the reservation.
 *
 * Responsibilities:
 *  - Query itemsCollection for items that reference the provided reservation id.
 *  - Maintain several modal visibility states (details, calendar, add, maintenance).
 *  - Collect selected items via checkboxes and call server methods to perform actions.
 *  - Provide basic error feedback via ErrorModal.
 *
 * Notes:
 *  - Error handling: Errors are surfaced to an ErrorModal (error.current string).
 *
 * TODOs:
 *  - Fix undeclared loop index (use `let i = 0`).
 *  - Convert checkbox handling to controlled React state for clarity and testability.
 *  - Add server-side validation and better UI feedback for server call failures.
 *
 * Usage:
 *  <ItemList reservation={reservationId} />
 */

import React, { startTransition, Suspense } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data/suspense';
import Calendar from 'react-calendar'; // https://github.com/wojtekmaj/react-calendar
import Modal from 'react-modal';
import styles from '../styles/itemList.css';
import stylesCalendarModal from '../styles/calendarModal.css';
import ItemListAddItem from './ItemListAddItem';
import { differenceInCalendarDays } from 'date-fns';
import { itemsCollection } from '../../api/items';
import CalendarStyle from 'react-calendar/dist/Calendar.css';
import ErrorModal from '../Modals/ErrorModal';

export const ItemList = (props) => {
    const { reservation } = props;

    const items=useTracker('userItemsReservation',()=>itemsCollection.find({"reservation._id":reservation}).fetch())

    // Local UI state
    const [modalVisible, setModalVisible] = React.useState(false);
    const [modalVisibleCalendar, setModalVisibleCalendar] = React.useState(false);
    const [modalVisibleAdd, setModalVisibleAdd] = React.useState(false);
    const [modalVisibleMaintenance, setModalVisibleMaintenance] = React.useState(false);
    const [errorModal, setErrorModalVisible] = React.useState(false);

    // Refs and helpers
    const error = React.useRef('');
    const editItem = React.useRef();
    const editItemReservations = React.useRef([]);
    const editItemName = React.useRef();
    const editItemUser = React.useRef();
    const selectedItems = React.useRef([]);
    const keyIndex = React.useRef(0);

    // Open details modal for clicked item and build array of reserved dates
    const onClick = (e) => {
        editItem.current = items.find((item) => item.name === e.target.textContent);

        // Build array of reserved dates for the calendar.
        editItem.current.reservation.map((res) => {
            let tmpDate = new Date(res.resStartDate);
            res.resStartDate.setHours(0, 0, 0, 0);
            res.resEndDate.setHours(0, 0, 0, 0);
            let resLen = differenceInCalendarDays(res.resEndDate, res.resStartDate);
            for (let i = 0; i <= resLen; i++) { // <-- `i` is undeclared; use `let i = 0`
                editItemReservations.current.push(new Date(tmpDate));
                tmpDate.setDate(tmpDate.getDate() + 1);
            }
        });

        startTransition(() => {
            setModalVisible(true);
        });
    };

    // Open add item modal
    const onClickAddItem = (e) => {
        startTransition(() => {
            setModalVisibleAdd(true);
        });
    };

    // Open maintenance modal if items selected, otherwise show error
    const onClickMaintenance = (e) => {
        if (selectedItems.current.length != 0) {
            startTransition(() => {
                setModalVisibleMaintenance(true);
            });
        } else {
            error.current = 'No selected items';
            startTransition(() => setErrorModalVisible(true));
        }
    };

    // Checkbox click handler (mutates selectedItems ref). Prefer controlled state.
    const onClickCheckbox = (e) => {
        if (e.target.checked) {
            selectedItems.current = [...selectedItems.current, e.target.parentNode.childNodes[0].id];
        } else {
            selectedItems.current.splice(selectedItems.current.indexOf(e.target.parentNode.childNodes[0].id), 1);
        }
    };

    // Close handlers wrapped in startTransition
    const onCloseModal = () => {
        startTransition(() => { setModalVisible(false); });
    };

    const onCloseModalAdd = () => {
        startTransition(() => { setModalVisibleAdd(false); });
    };

    const onCloseModalMaintenance = () => {
        startTransition(() => { setModalVisibleMaintenance(false); });
    };

    const onCloseModalCalendar = () => {
        startTransition(() => { setModalVisibleCalendar(false); });
    };

    // Calendar tile class: mark reserved dates
    const tileClassName = ({ date, view }) => {
        // Add class to tiles in month view only and check if date in reserved array
        if (view === 'month' && editItemReservations.current.find(res => differenceInCalendarDays(res, date) === 0)) {
            return 'react-calendar__tile__reserved';
        }
    };

    // Clicking a day shows reservation details (owner)
    const onClickDay = (e) => {
        editItemName.current = editItem.current.reservation.find(res => res.resStartDate <= e && res.resEndDate >= e);
        // Guard access: ensure editItemName.current is defined
        if (editItemName.current) {
            editItemUser.current = Meteor.users.findOne(editItemName.current.user).username;
        }
        startTransition(() => {
            setModalVisibleCalendar(true);
        });
    };

    // Server calls for returning items
    const onClickReturnItem = (e) => {
        Meteor.callAsync('returnItemFromReservartion', selectedItems.current, props.reservation)
            .then(res => {
                selectedItems.current = [];
            })
            .catch(err => {
                // --- TODO --- (ErrorModal) instead of silent failure
                // eslint-disable-next-line no-console
                console.error('returnItemFromReservation failed', err);
            });
    };

    const onClickReturnItemMaintenance = () => {
        const info = document.getElementById('item-info').value;
        Meteor.callAsync('returnItemToMaintenance', selectedItems.current, props.reservation, info)
            .then(res => {
                selectedItems.current = [];
            })
            .catch(err => {
                // eslint-disable-next-line no-console
                console.error('returnItemToMaintenance failed', err);
            });
    };

    return (
        <div id="item-list" style={styles}>
            <Modal
                isOpen={modalVisible}
                onRequestClose={onCloseModal}
                className={'item-list-modal'}
                closeTimeoutMS={300}
                style={styles}
            >
                {editItem.current != undefined ? (
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
                        {editItemName.current != undefined ? (
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
                        ) : (null)}
                    </div>
                ) :
                    (null)}
            </Modal>

            <Modal
                isOpen={modalVisibleAdd}
                onRequestClose={onCloseModalAdd}
                className={'item-list-modal'}
                closeTimeoutMS={300}
                style={styles}
            >
                <Suspense><ItemListAddItem modalSetter={onCloseModalAdd} reservation={props.reservation} /></Suspense>
            </Modal>

            <Modal
                isOpen={modalVisibleMaintenance}
                onRequestClose={onCloseModalMaintenance}
                className={'item-list-modal-maintenance'}
                closeTimeoutMS={300}
                style={styles}
            >
                <label>Info</label>
                <textarea id='item-info' type="text" placeholder='Info' />
                <button onClick={onClickReturnItemMaintenance}>Return to maintenance</button>
                <button onClick={onCloseModalMaintenance}>Cancel</button>
            </Modal>

            {items[0] != undefined ? (

                <div id="item-list-modal-container">
                    <ul>
                        {items.map(item =>
                            <div id='item-list-edit-li' key={`${item._id} ${keyIndex.current += 1}`}>
                                <li onClick={(e) => onClick(e)}
                                    key={keyIndex.current += 1}
                                    id={`${item._id}`}>
                                    <label>
                                        <a>
                                            {item.name}
                                        </a>
                                    </label>
                                </li>
                                <input
                                    id={`${item.name}Checkbox`}
                                    type="checkbox"
                                    onClick={(e) => onClickCheckbox(e)}>
                                </input>
                            </div>
                        )}
                    </ul>
                </div>
            ) :
                (<div>
                    <p style={{ textAlign: 'center' }}>Reservation is empty</p>
                </div>)}
            <ErrorModal error={error.current} modalVisible={errorModal} modalSetter={setErrorModalVisible} />
            <div id='item-list-buttons'>
                <button onClick={onClickMaintenance}>Return to maintenance</button>
                <button onClick={onClickReturnItem}>Return</button>
                <button onClick={onClickAddItem}>Add item</button>
            </div>
        </div>
    );
};

export default ItemList;