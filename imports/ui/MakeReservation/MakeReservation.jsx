/**
 * MakeReservation.jsx
 *
 * Small wrapper control that opens the reservation creation modal.
 *
 * Responsibilities:
 *  - Render a "Make Reservation" button that opens a react-modal.
 *  - Render ItemListReservation inside the modal (suspended).
 *
 * Usage:
 *  <MakeReservation />
 *
 * What the code does (step-by-step):
 *  - Calls Modal.setAppElement('#app') to configure react-modal accessibility.
 *  - Maintains local modalVisible state to control modal open/close.
 *  - openModal: sets modalVisible to true inside startTransition.
 *  - onModalClose: sets modalVisible to false inside startTransition.
 *  - Renders a button that opens the modal.
 *  - When modal is open it shows a close button and a Suspense-wrapped ItemListReservation.
 */

import React, { startTransition, Suspense } from 'react';
import Modal from 'react-modal'
import styles from '../styles/MakeReservation.css'
import ItemListReservation from "../Lists/ItemListReservation";

export const MakeReservation = () => {

    const [modalVisible, setModalVisible] = React.useState(false);

    const openModal = (e) => {
        startTransition(() => setModalVisible(true))
    }

    const onModalClose = () => {
        startTransition(() => setModalVisible(false))
    }

    return (
        <div id='make-reservation' style={styles}>
            <button onClick={openModal}>Make Reservation</button>
            <Modal
                isOpen={modalVisible}
                onRequestClose={onModalClose}
                className={'make-reservation-modal'}
                closeTimeoutMS={300}
                style={styles}
            >
                <button
                    id='make-reservation-modal-close-button'
                    onClick={onModalClose}
                >
                    X
                </button>
                <Suspense><ItemListReservation modalSetter={onModalClose} /></Suspense>
            </Modal>
        </div>
    )

}

export default MakeReservation;