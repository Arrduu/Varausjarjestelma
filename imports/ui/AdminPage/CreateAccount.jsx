/**
 * CreateAccount.jsx
 *
 * Small admin control that opens a modal to create a new user account and assign a role.
 *
 * Responsibilities:
 *  - Render a "Create account" button that opens a react-modal.
 *  - Collect username, password and role from a form.
 *  - Call server methods to create the user and set their role.
 *  - Close the modal after the async operations complete.
 *
 * Notes & accessibility:
 *  - Modal.setAppElement('#app') is called to configure aria-hidden behavior for react-modal;
 *    ensure an element with id="app" exists in the DOM (usually the app root).
 *  - startTransition is used to mark UI updates as non-urgent.
 *  - Meteor.callAsync is used for server calls — these return Promises.
 *  - The file imports a CSS module (styles). Passing it directly to the `style` prop
 *    assumes it exports an inline-style object. If it is a CSS file, prefer className.
 *
 * Usage:
 *  <CreateAccount />
 */

import React,{startTransition} from 'react'
import Modal from 'react-modal';
import { Meteor } from 'meteor/meteor';
import styles from '../styles/createUser.css'


export const CreateAccount = () => {
    const [modalVisible, setModalVisible] = React.useState(false);

    // Open modal (wrap state update in startTransition)
    const openModal =(e)=>{
        startTransition(()=>{setModalVisible(true)})
    }

    // Form submit handler:
    // - prevents default form submit
    // - reads values from the form controls
    // - calls server method to create the user, then sets role
    // - closes the modal after operations succeed
    const onSubmit=(e)=>{
        e.preventDefault()

        // Read values by the input names/ids in the form.
        // Note: using e.target.<controlId>.value relies on the control having a matching name/id.
        const userName = e.target.createUserName.value
        const userPass = e.target.createUserPass.value
        const userRole = e.target.roles.value.toLowerCase()

        // Call server method to create user (returns a Promise from callAsync)
        Meteor.callAsync('createUserServer', userName, userPass).then(res =>
            // After user created, set the role and close modal on completion.
            startTransition(() => {
                Meteor.callAsync('setUserRole', userName, userRole).then(res => {
                    startTransition(() => {
                        setModalVisible(false);
                    })
                })
            })
        ).catch(err => {
            // Minimal error handling: log the error. Replace with UI feedback as needed.
            // --- TODO --- (Consider using an ErrorModal or toast for user-visible errors.)
            // eslint-disable-next-line no-console
            console.error('Create account failed', err)
        })
    }


    return(
    <div id='CreateAccount' style={styles}>
        <button onClick={openModal}>Create account</button>

        <Modal
            isOpen={modalVisible}
            onRequestClose={()=>{setModalVisible(false)}}
            className={'createUserModal'}
            closeTimeoutMS={300}
            style={styles}
        >
            <form onSubmit={onSubmit} style={styles}>
                <label>Username</label>
                <input id='createUserName' name='createUserName' type="text" placeholder='User' required/>

                <label>Password</label>
                <input id='createUserPass' name='createUserPass' type="password" placeholder='Password' required/>

                <label>Role</label>
                <select name="roles" id="roles">
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                </select>

                <button id='createUserSubmitButton' type='submit'>Create</button>
            </form>
        </Modal>
    </div>
)};


export default CreateAccount;