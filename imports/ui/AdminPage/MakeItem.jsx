/**
 * MakeItem.jsx
 *
 * Small admin control that opens a modal to create a new inventory item.
 *
 * Responsibilities:
 *  - Render a "Create item" button that opens a react-modal form.
 *  - Collect item data (name, category, manufacturer URL, info) and call a server
 *    method to insert the item into the database.
 *  - Close the modal once the async insert completes.
 *
 * Notes & recommendations:
 *  - Modal.setAppElement('#app') is called for accessibility (aria-hidden). Ensure
 *    an element with id="app" exists in your DOM (typically the application root).
 *  - startTransition is used to mark UI updates as non-urgent (React 18+).
 *  - Meteor.callAsync returns a Promise; basic success handling closes the modal.
 *
 * Usage:
 *  <MakeItem />
 */

import {Meteor} from "meteor/meteor"
import React, { useState, useEffect, useRef, startTransition } from 'react';
import Modal from 'react-modal'
import styles from '../styles/makeItem.css'

export const MakeItem = () => {

    const [modalVisible, setModalVisible] = React.useState(false);

    // Open modal wrapped in startTransition to mark as non-urgent
    const openModal = (e) => {
        startTransition(() => {
            setModalVisible(true)
        })
    }

    // Submit handler: gathers form values then calls server method to insert item.
    // After the insert resolves the modal is closed. No user-visible error UI yet.
    const onSubmit = (e) => {
        e.preventDefault()
        const name = document.getElementById("item-name").value
        const category = document.getElementById("categories").value
        const reserveDate = new Date();
        const returnDate = new Date();
        const manUrl = document.getElementById("item-manUrl").value
        const info = document.getElementById("item-info").value
        const status = "Available";
        const user = "";
        const reservation = [];
        const available = true;

        Meteor.callAsync('insertItemDB', name, category, reserveDate, returnDate, manUrl, info, status, user, reservation, available)
            .then(res =>
                startTransition(() => {
                    setModalVisible(false)
                })
            )
            .catch(err => {
                // --- TODO --- Minimal logging; replace with ErrorModal/toast for user feedback.
                // eslint-disable-next-line no-console
                console.error('insertItemDB failed', err)
            })
    }

    return (
        <div id='CreateAccount' style={styles}>
            <button onClick={openModal}>Create item</button>
            <Modal
                isOpen={modalVisible}
                onRequestClose={() => { setModalVisible(false) }}
                className={'createItemModal'}
                closeTimeoutMS={300}
                style={styles}
            >
                <form onSubmit={onSubmit} style={styles}>
                    <label>Name</label>
                    <input key={"itemname"} id='item-name' type="text" placeholder='Name' required/>
                    <label>Category</label>
                    <select name="Category" id="categories">
                        <option value="Cables">Cables</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Electronics">Electronics</option>
                    </select>
                    <label>Manufacturer URL</label>
                    <input id='item-manUrl' type="text" placeholder='URL'/>
                    <label>Info</label>
                    <textarea id='item-info' type="text" placeholder='Info'/>
                    <button id='create-item-submit-button' type='submit'>Create</button>
                </form>
            </Modal>
        </div>
    )
}

export default MakeItem