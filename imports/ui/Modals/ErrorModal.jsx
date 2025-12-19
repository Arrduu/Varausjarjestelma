/**
 * ErrorModal.jsx
 *
 * Small, reusable modal component to display an error message and an "OK" button.
 *
 * Usage:
 *  <ErrorModal
 *    error={"Something went wrong"}
 *    modalVisible={isVisible}        // boolean - controls visibility
 *    modalSetter={setIsVisible}      // function - called to hide the modal
 *  />
 *
 * Props:
 *  - error: string | ReactNode    The message or node to display inside the modal header.
 *  - modalVisible: boolean        Whether the modal is open.
 *  - modalSetter: (boolean) => void
 *
 * Notes:
 *  - This component uses react-modal. Modal.setAppElement('#app') is called to
 *    configure aria-hidden behavior for accessibility; ensure an element with id="app"
 *    exists in the DOM (typically the application's root).
 *  - startTransition is used to mark the state update as non-urgent (React 18+).
 *  - The file imports Meteor but the import is currently unused — safe to remove if not needed.
 *  - The component applies a CSS module import (styles) and a className 'error-modal'.
 *    react-modal accepts both className and a style object. Ensure `styles` matches
 *    the expected shape for react-modal's style prop if you rely on inline styles.
 */

import React, { startTransition, useEffect } from 'react'
import Modal from 'react-modal';
import styles from '../styles/errorModal.css'


export const ErrorModal = (props) => {

    const {error,modalVisible,modalSetter}=props

    // onClick closes the modal. We wrap the state update in startTransition to hint
    // React that hiding the modal is a non-urgent update (helps keep UI responsive).
    const onClick = () => {
        startTransition(() => modalSetter(false))
    }

    return (
        <Modal
            isOpen={modalVisible}
            onRequestClose={onClick}    // close when overlay clicked or Esc pressed
            className={'error-modal'}   // CSS class applied to the modal content
            closeTimeoutMS={300}        // milliseconds for close animation
            style={styles}              // CSS module or inline style object
        >
            <div id='error-modal-container'>
                <h1>{error}</h1>
                <button onClick={onClick}>OK</button>
            </div>
        </Modal>
    )
};


export default ErrorModal;